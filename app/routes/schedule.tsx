import { useMemo, useState } from "react";
import { Form, Link, useLoaderData, useNavigation } from "@remix-run/react";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { ArrowRight, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { findById, findByName } from "~/lib/stations.server";
import { getSchedule, ScrapeShapeChanged } from "~/lib/schedule.server";
import { bucketForTime, nowInLjubljana, shiftISO, type TimeBucket } from "~/lib/format";
import { ScheduleEntry } from "~/components/ScheduleEntry";
import { Filters, type FiltersState } from "~/components/Filters";
import { SortTabs, type SortKey } from "~/components/SortTabs";
import { SaveRouteButton } from "~/components/SaveRouteButton";
import { RouteMap, type MapPoint } from "~/components/RouteMap";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) return [{ title: "Nomago Ride" }];
  return [
    {
      title: `${data.fromStation?.name ?? "?"} → ${data.toStation?.name ?? "?"} · ${data.date}`,
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const fromId = url.searchParams.get("from") ?? "";
  const toId = url.searchParams.get("to") ?? "";
  const date = url.searchParams.get("date") ?? "";

  if (!fromId || !toId || !date) {
    throw new Response("Missing from, to or date", { status: 400 });
  }

  const [fromStation, toStation] = await Promise.all([findById(fromId), findById(toId)]);
  if (!fromStation || !toStation) {
    throw new Response("Unknown station id", { status: 404 });
  }

  try {
    const schedule = await getSchedule({ fromId, toId, date });

    // Build a canonical ordered list of stops across the day's entries.
    // Pick the entry with the most intermediate stops (typically the all-stops
    // variant of the line) and use its order as the polyline path.
    type MapStop = { name: string; latitude: number; longitude: number; endpoint: boolean };
    let routeStops: MapStop[] = [];
    if (schedule.entries.length > 0) {
      const longest = schedule.entries.reduce((best, e) =>
        e.stops.length > best.stops.length ? e : best,
      );
      const resolved = await Promise.all(
        longest.stops.map(async (s) => ({ name: s.name, station: await findByName(s.name) })),
      );
      routeStops = resolved
        .filter(
          (r) =>
            r.station?.latitude !== undefined &&
            r.station?.longitude !== undefined &&
            Number.isFinite(r.station.latitude) &&
            Number.isFinite(r.station.longitude),
        )
        .map((r, i, arr) => ({
          name: r.name,
          latitude: r.station!.latitude!,
          longitude: r.station!.longitude!,
          endpoint: i === 0 || i === arr.length - 1,
        }));
    }
    // Fallback if intermediate-stop resolution failed.
    if (routeStops.length < 2) {
      routeStops = [];
      if (fromStation.latitude !== undefined && fromStation.longitude !== undefined) {
        routeStops.push({
          name: fromStation.name,
          latitude: fromStation.latitude,
          longitude: fromStation.longitude,
          endpoint: true,
        });
      }
      if (toStation.latitude !== undefined && toStation.longitude !== undefined) {
        routeStops.push({
          name: toStation.name,
          latitude: toStation.latitude,
          longitude: toStation.longitude,
          endpoint: true,
        });
      }
    }

    return {
      fromStation: {
        id: fromStation.id,
        name: fromStation.name,
        latitude: fromStation.latitude ?? null,
        longitude: fromStation.longitude ?? null,
      },
      toStation: {
        id: toStation.id,
        name: toStation.name,
        latitude: toStation.latitude ?? null,
        longitude: toStation.longitude ?? null,
      },
      date,
      entries: schedule.entries,
      sourceUrl: schedule.sourceUrl,
      now: nowInLjubljana(),
      routeStops,
    };
  } catch (err) {
    if (err instanceof ScrapeShapeChanged) {
      throw new Response(err.message, { status: 502 });
    }
    throw err;
  }
}

export default function Schedule() {
  const data = useLoaderData<typeof loader>();
  const nav = useNavigation();
  const loading = nav.state !== "idle" && nav.location?.pathname === "/schedule";

  const maxAvailableDuration = Math.max(
    60,
    ...data.entries.map((e) => e.durationMinutes),
  );

  const [filters, setFilters] = useState<FiltersState>({
    hidePassed: true,
    directOnly: false,
    buckets: new Set<TimeBucket>(),
    maxDuration: null,
  });
  const [sort, setSort] = useState<SortKey>("earliest");

  const isPast = useMemo(() => {
    return (departureHHMM: string): boolean => {
      if (data.date < data.now.dateISO) return true;
      if (data.date > data.now.dateISO) return false;
      return departureHHMM < data.now.hhmm;
    };
  }, [data.date, data.now.dateISO, data.now.hhmm]);

  const filtered = useMemo(() => {
    const list = data.entries.filter((e) => {
      if (filters.hidePassed && isPast(e.departure.time)) return false;
      if (filters.directOnly && !e.isDirect) return false;
      if (filters.buckets.size > 0) {
        const b = bucketForTime(e.departure.time);
        if (!b || !filters.buckets.has(b)) return false;
      }
      if (filters.maxDuration !== null && e.durationMinutes > filters.maxDuration) return false;
      return true;
    });
    list.sort((a, b) => {
      if (sort === "fastest") return a.durationMinutes - b.durationMinutes;
      return a.departure.time.localeCompare(b.departure.time);
    });
    return list;
  }, [data.entries, filters, sort, isPast]);

  const prevDay = shiftISO(data.date, -1);
  const nextDay = shiftISO(data.date, 1);

  function dayLink(d: string): string {
    const p = new URLSearchParams({
      from: data.fromStation.id,
      to: data.toStation.id,
      date: d,
    });
    return `/schedule?${p}`;
  }

  const mapPoints: MapPoint[] = data.routeStops;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Schedule
          </div>
          <h1 className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            <span>{data.fromStation.name}</span>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <span>{data.toStation.name}</span>
          </h1>
          <div className="mt-2 inline-flex items-center gap-1 rounded-md border border-border bg-card p-0.5 text-sm">
            <Link
              to={dayLink(prevDay)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Previous day"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <span className="px-2 font-mono text-xs tabular-nums">{data.date}</span>
            <Link
              to={dayLink(nextDay)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Next day"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:self-end">
          <SaveRouteButton
            from={{ id: data.fromStation.id, name: data.fromStation.name }}
            to={{ id: data.toStation.id, name: data.toStation.name }}
          />
          <Form method="get" action="/">
            <input type="hidden" name="from" value={data.fromStation.id} />
            <input type="hidden" name="to" value={data.toStation.id} />
            <input type="hidden" name="date" value={data.date} />
            <Button type="submit" variant="outline" size="md">
              <Pencil className="h-3.5 w-3.5" />
              Edit search
            </Button>
          </Form>
        </div>
      </header>

      {mapPoints.length >= 2 ? (
        <Card className="animate-scale-in overflow-hidden p-0">
          <RouteMap points={mapPoints} compact className="h-56 sm:h-64" />
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        <Filters
          state={filters}
          onChange={setFilters}
          maxAvailableDuration={maxAvailableDuration}
        />

        <div className="space-y-4">
          <SortTabs value={sort} onChange={setSort} count={filtered.length} />

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed p-8 text-center">
              <div className="text-base font-medium">No departures match.</div>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.entries.length === 0
                  ? "Nomago returned no buses for this date. Try another day."
                  : "Loosen a filter — clear time-of-day or raise max duration."}
              </p>
            </Card>
          ) : (
            <ul className="space-y-3">
              {filtered.map((e, i) => (
                <li
                  key={e.tripId}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}
                >
                  <ScheduleEntry entry={e} isPast={isPast(e.departure.time)} />
                </li>
              ))}
            </ul>
          )}

          <p className="pt-2 text-xs text-muted-foreground">
            Data scraped from{" "}
            <a
              className="underline underline-offset-2 hover:text-foreground"
              href={data.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              the public Nomago page
            </a>
            . Cached 15 minutes per query.
          </p>
        </div>
      </div>
    </div>
  );
}
