import { useState } from "react";
import { Link, useSearchParams } from "@remix-run/react";
import { ChevronDown, Clock } from "lucide-react";
import type { ScheduleEntry as Entry } from "~/lib/schedule.server";
import { formatDurationMinutes } from "~/lib/format";
import { StopsTimeline } from "./StopsTimeline";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { cn } from "~/lib/cn";

type Props = {
  entry: Entry;
  isPast?: boolean;
};

export function ScheduleEntry({ entry, isPast = false }: Props) {
  const [open, setOpen] = useState(false);
  const [params] = useSearchParams();

  const detailHref = `/trip/${encodeURIComponent(entry.tripId)}?${params.toString()}`;
  const dimmed = isPast;

  return (
    <Card
      className={cn(
        "hover-lift",
        dimmed ? "opacity-55" : "hover:border-foreground/20",
      )}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
        <div className="grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
          <div className="min-w-0 text-left">
            <div className="font-mono text-[28px] font-semibold tabular-nums tracking-[-0.04em] leading-none">
              {entry.departure.time}
            </div>
            <div className="mt-1.5 truncate text-xs text-muted-foreground">
              {entry.departure.city}
            </div>
          </div>

          <DurationConnector
            durationLabel={formatDurationMinutes(entry.durationMinutes)}
            isDirect={entry.isDirect}
            transfers={entry.transfers}
          />

          <div className="min-w-0 text-right">
            <div className="font-mono text-[28px] font-semibold tabular-nums tracking-[-0.04em] leading-none">
              {entry.arrival.time}
            </div>
            <div className="mt-1.5 truncate text-xs text-muted-foreground">
              {entry.arrival.city}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:flex-col sm:items-stretch">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="flex-1 sm:flex-none"
          >
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
            />
            {open ? "Hide stops" : `${entry.stops.length} stops`}
          </Button>
          <Link
            to={detailHref}
            prefetch="intent"
            className="inline-flex h-8 flex-1 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 sm:flex-none"
          >
            Details
          </Link>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border px-4 pb-5 pt-4 sm:px-6 animate-fade-in">
          <StopsTimeline stops={entry.stops} />
        </div>
      ) : null}
    </Card>
  );
}

function DurationConnector({
  durationLabel,
  isDirect,
  transfers,
}: {
  durationLabel: string;
  isDirect: boolean;
  transfers: number;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="inline-flex items-center gap-1 text-[11px] font-medium tabular-nums text-muted-foreground">
        <Clock className="h-3 w-3" />
        {durationLabel}
      </div>
      <svg
        viewBox="0 0 96 12"
        className="h-3 w-24 sm:w-32"
        fill="none"
        aria-hidden
      >
        <line
          x1="2"
          y1="6"
          x2="94"
          y2="6"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeDasharray="3 4"
          className="text-border"
        />
        <circle cx="2" cy="6" r="2" className="fill-accent" />
        <path
          d="M86 6 l-6 -4 v8 z"
          className="fill-accent"
        />
      </svg>
      <Badge
        variant={isDirect ? "success" : "warning"}
        className="lowercase tracking-normal"
      >
        {isDirect ? "direct" : `${transfers} transfer${transfers === 1 ? "" : "s"}`}
      </Badge>
    </div>
  );
}
