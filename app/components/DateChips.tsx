import { useId } from "react";
import { Calendar } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { nextSaturdayISO, shiftISO, todayISO } from "~/lib/format";
import { cn } from "~/lib/cn";

type Props = {
  name: string;
  value: string;
  onChange: (value: string) => void;
};

export function DateChips({ name, value, onChange }: Props) {
  const inputId = useId();
  const today = todayISO();
  const tomorrow = shiftISO(today, 1);
  const inTwo = shiftISO(today, 2);
  const weekend = nextSaturdayISO(today);

  const chips: { label: string; date: string }[] = [
    { label: "Today", date: today },
    { label: "Tomorrow", date: tomorrow },
    { label: "+2 days", date: inTwo },
    { label: "Weekend", date: weekend },
  ];

  return (
    <div>
      <Label htmlFor={inputId}>Date</Label>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={inputId}
            name={name}
            type="date"
            value={value}
            min={today}
            onChange={(e) => onChange(e.target.value)}
            className="h-12 pl-9 pr-3 text-base font-medium"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => {
            const active = value === c.date;
            return (
              <button
                key={c.label}
                type="button"
                onClick={() => onChange(c.date)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  active
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-background text-foreground/80 hover:bg-secondary",
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
