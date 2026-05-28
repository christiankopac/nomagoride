import { SlidersHorizontal } from "lucide-react";
import { BUCKET_LABELS, type TimeBucket } from "~/lib/format";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/cn";

export type FiltersState = {
  hidePassed: boolean;
  directOnly: boolean;
  buckets: Set<TimeBucket>;
  maxDuration: number | null;
};

type Props = {
  state: FiltersState;
  onChange: (next: FiltersState) => void;
  maxAvailableDuration: number;
};

const ALL_BUCKETS: TimeBucket[] = ["early", "morning", "afternoon", "evening", "night"];
const SHORT_BUCKET: Record<TimeBucket, string> = {
  early: "Early",
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  night: "Night",
};

export function Filters({ state, onChange, maxAvailableDuration }: Props) {
  function toggleBucket(b: TimeBucket) {
    const next = new Set(state.buckets);
    if (next.has(b)) next.delete(b);
    else next.add(b);
    onChange({ ...state, buckets: next });
  }

  return (
    <aside className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold tracking-tight">Filters</h2>
      </div>

      <div className="space-y-5 p-4">
        <div className="flex flex-col gap-2.5">
          <Toggle
            checked={state.hidePassed}
            onChange={(v) => onChange({ ...state, hidePassed: v })}
            label="Hide already departed"
          />
          <Toggle
            checked={state.directOnly}
            onChange={(v) => onChange({ ...state, directOnly: v })}
            label="Direct only"
          />
        </div>

        <Separator />

        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Time of day
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ALL_BUCKETS.map((b) => {
              const on = state.buckets.has(b);
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => toggleBucket(b)}
                  title={BUCKET_LABELS[b]}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                    on
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-foreground/80 hover:bg-secondary",
                  )}
                >
                  {SHORT_BUCKET[b]}
                </button>
              );
            })}
          </div>
          {state.buckets.size > 0 ? (
            <button
              type="button"
              onClick={() => onChange({ ...state, buckets: new Set() })}
              className="mt-2 text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Clear time filter
            </button>
          ) : null}
        </div>

        <Separator />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Max duration
            </span>
            <span className="font-mono text-xs tabular-nums text-foreground">
              {state.maxDuration === null
                ? "any"
                : `${Math.floor(state.maxDuration / 60)}h ${state.maxDuration % 60}m`}
            </span>
          </div>
          <input
            type="range"
            min={15}
            max={Math.max(60, maxAvailableDuration)}
            step={5}
            value={state.maxDuration ?? Math.max(60, maxAvailableDuration)}
            onChange={(e) =>
              onChange({
                ...state,
                maxDuration:
                  Number(e.target.value) >= maxAvailableDuration
                    ? null
                    : Number(e.target.value),
              })
            }
            className="w-full accent-accent"
          />
        </div>
      </div>
    </aside>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
      <span className="text-foreground/90">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition",
          checked ? "bg-accent" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-background shadow transition",
            checked ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </button>
    </label>
  );
}
