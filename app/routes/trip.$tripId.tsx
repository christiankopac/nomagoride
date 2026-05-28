import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { findById, findByName } from "~/lib/stations.server";
import { getSchedule } from "~/lib/schedule.server";
import { formatDurationMinutes } from "~/lib/format";
import { StopsTimeline } from "~/components/StopsTimeline";
import { RouteMap, type MapPoint } from "~/components/RouteMap";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) return [{ title: "Trip · Nomago Ride" }];
  return [
    {
      title: `${data.entry.departure.city} → ${data.entry.arrival.city} · ${data.entry.departure.time}`,
    },
  ];
};

export async function loader({ params, request }: LoaderFunctionArgs) {
  const tripId = params.tripId;
  if (!tripId) throw new Response("Missing trip id", { status: 400 });

  const url = new URL(request.url);
  const fromId = url.searchParams.get("from") ?? "";
  const toId = url.searchParams.get("to") ?? "";
  const date = url.searchParams.get("date") ?? "";
  if (!fromId || !toId || !date) {
    throw new Response("Trip detail requires from, to, and date in the URL.", { status: 400 });
  }

  const [fromStation, toStation, schedule] = await Promise.all([
    findById(fromId),
    findById(toId),
    getSchedule({ fromId, toId, date }),
  ]);
  if (!fromStation || !toStation) {
    throw new Response("Unknown station id", { status: 404 });
  }

  const entry = schedule.entries.find((e) => e.tripId === tripId);
  if (!entry) {
    throw new Response("Trip not found for this date.", { status: 404 });
  }

  // Look up coordinates for every intermediate stop.
  const mapPoints: MapPoint[] = [];
  for (let i = 0; i < entry.stops.length; i++) {
    const stop = entry.stops[i];
    const station = await findByName(stop.name);
    if (
      station?.latitude !== undefined &&
      station?.longitude !== undefined &&
      Number.isFinite(station.latitude) &&
      Number.isFinite(station.longitude)
    ) {
      mapPoints.push({
        name: stop.name,
        latitude: station.latitude,
        longitude: station.longitude,
        endpoint: i === 0 || i === entry.stops.length - 1,
      });
    }
  }
  // Fallback to just the endpoints if intermediate lookups failed.
  if (mapPoints.length < 2) {
    mapPoints.length = 0;
    if (fromStation.latitude !== undefined && fromStation.longitude !== undefined) {
      mapPoints.push({
        name: fromStation.name,
        latitude: fromStation.latitude,
        longitude: fromStation.longitude,
        endpoint: true,
      });
    }
    if (toStation.latitude !== undefined && toStation.longitude !== undefined) {
      mapPoints.push({
        name: toStation.name,
        latitude: toStation.latitude,
        longitude: toStation.longitude,
        endpoint: true,
      });
    }
  }

  return {
    entry,
    date,
    mapPoints,
    backHref: `/schedule?from=${encodeURIComponent(fromId)}&to=${encodeURIComponent(toId)}&date=${encodeURIComponent(date)}`,
  };
}

export default function TripDetail() {
  const { entry, date, backHref, mapPoints } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <Link
        to={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to schedule
      </Link>

      <Card className="p-6">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Trip · <span className="font-mono tabular-nums">{date}</span>
        </div>
        <h1 className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xl font-semibold tracking-tight">
          <span>{entry.departure.city}</span>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
          <span>{entry.arrival.city}</span>
        </h1>
        <div className="mt-6 grid grid-cols-3 items-center gap-4">
          <div>
            <div className="font-mono text-3xl font-semibold tabular-nums tracking-tight">
              {entry.departure.time}
            </div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Departure
            </div>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 text-sm font-medium">
              <Clock className="h-3.5 w-3.5" />
              {formatDurationMinutes(entry.durationMinutes)}
            </div>
            <div className="mt-1">
              <Badge variant={entry.isDirect ? "success" : "warning"} className="lowercase tracking-normal">
                {entry.isDirect
                  ? "direct"
                  : `${entry.transfers} transfer${entry.transfers === 1 ? "" : "s"}`}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-3xl font-semibold tabular-nums tracking-tight">
              {entry.arrival.time}
            </div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Arrival
            </div>
          </div>
        </div>
      </Card>

      {mapPoints.length >= 2 ? (
        <Card className="animate-scale-in overflow-hidden p-0">
          <RouteMap points={mapPoints} className="h-80 sm:h-96" />
        </Card>
      ) : null}

      <Card className="p-6">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Stops
        </h2>
        <StopsTimeline stops={entry.stops} />
      </Card>
    </div>
  );
}
