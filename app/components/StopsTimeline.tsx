import { Circle } from "lucide-react";
import type { Stop } from "~/lib/schedule.server";
import { cn } from "~/lib/cn";

type Props = { stops: Stop[] };

export function StopsTimeline({ stops }: Props) {
  if (stops.length === 0) {
    return <p className="text-sm text-muted-foreground">No intermediate stops listed.</p>;
  }
  return (
    <ol className="relative ml-3 border-l-2 border-border">
      {stops.map((s, i) => {
        const first = i === 0;
        const last = i === stops.length - 1;
        const endpoint = first || last;
        return (
          <li key={`${s.name}-${i}`} className="ml-4 pb-4 last:pb-0">
            <span
              className={cn(
                "absolute -left-[7px] mt-1.5 inline-flex h-3 w-3 items-center justify-center rounded-full ring-4 ring-background",
                endpoint ? "bg-accent" : "bg-muted-foreground/40",
              )}
              aria-hidden
            >
              {endpoint ? <Circle className="h-1 w-1 fill-current text-accent-foreground" /> : null}
            </span>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span
                className={cn(
                  "text-sm",
                  endpoint ? "font-semibold text-foreground" : "text-foreground/80",
                )}
              >
                {s.name}
              </span>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {s.arrival ? <span title="Arrival">{s.arrival}</span> : null}
                {s.arrival && s.departure ? <span className="text-border"> · </span> : null}
                {s.departure ? <span title="Departure">{s.departure}</span> : null}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
