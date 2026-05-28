import { useEffect, useRef, useState } from "react";
import { Clock3, Zap } from "lucide-react";
import { cn } from "~/lib/cn";

export type SortKey = "earliest" | "fastest";

type Props = {
  value: SortKey;
  onChange: (v: SortKey) => void;
  count: number;
};

const TABS: { key: SortKey; label: string; icon: typeof Clock3 }[] = [
  { key: "earliest", label: "Earliest", icon: Clock3 },
  { key: "fastest", label: "Fastest", icon: Zap },
];

export function SortTabs({ value, onChange, count }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false });

  useEffect(() => {
    const i = TABS.findIndex((t) => t.key === value);
    const btn = btnRefs.current[i];
    const wrap = wrapRef.current;
    if (!btn || !wrap) return;
    const wrapBox = wrap.getBoundingClientRect();
    const btnBox = btn.getBoundingClientRect();
    setIndicator({
      left: btnBox.left - wrapBox.left,
      width: btnBox.width,
      ready: true,
    });
  }, [value]);

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm text-muted-foreground">
        <span className="font-semibold tabular-nums text-foreground">{count}</span>{" "}
        {count === 1 ? "departure" : "departures"}
      </div>
      <div
        ref={wrapRef}
        className="relative inline-flex rounded-md border border-border bg-card p-0.5 shadow-sm"
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-0.5 bottom-0.5 rounded-sm bg-foreground shadow-sm",
            indicator.ready ? "transition-[left,width] duration-300 ease-out" : "opacity-0",
          )}
          style={{ left: indicator.left, width: indicator.width }}
        />
        {TABS.map((t, i) => {
          const Icon = t.icon;
          const active = value === t.key;
          return (
            <button
              key={t.key}
              ref={(el) => (btnRefs.current[i] = el)}
              type="button"
              onClick={() => onChange(t.key)}
              className={cn(
                "relative z-10 inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
                active ? "text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
