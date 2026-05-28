import { useEffect, useId, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/cn";

export type StationOption = { id: string; name: string };

type Props = {
  name: string;
  label: string;
  placeholder?: string;
  initialId?: string;
  initialLabel?: string;
};

export function StationCombobox({ name, label, placeholder, initialId, initialLabel }: Props) {
  const inputId = useId();
  const listboxId = useId();
  const [query, setQuery] = useState(initialLabel ?? "");
  const [selectedId, setSelectedId] = useState(initialId ?? "");
  const [options, setOptions] = useState<StationOption[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setOptions([]);
      return;
    }
    abortRef.current?.abort();
    const ctl = new AbortController();
    abortRef.current = ctl;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/stations?q=${encodeURIComponent(query)}`, {
          signal: ctl.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as StationOption[];
        setOptions(data);
        setActiveIndex(data.length ? 0 : -1);
      } catch {
        // aborted or network — ignore
      } finally {
        setLoading(false);
      }
    }, 140);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function commit(opt: StationOption) {
    setQuery(opt.name);
    setSelectedId(opt.id);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && options[activeIndex]) {
        e.preventDefault();
        commit(options[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="relative mt-1.5">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={inputId}
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 && options[activeIndex]
              ? `${listboxId}-${activeIndex}`
              : undefined
          }
          placeholder={placeholder}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedId("");
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          className="h-12 pl-9 pr-9 text-base font-medium"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : null}
      </div>
      <input type="hidden" name={name} value={selectedId} />
      {open && (options.length > 0 || loading) ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-border bg-popover text-popover-foreground shadow-lg animate-fade-in"
        >
          {loading && options.length === 0 ? (
            <li className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
            </li>
          ) : null}
          {options.map((opt, i) => (
            <li
              key={opt.id}
              id={`${listboxId}-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                commit(opt);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={cn(
                "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm",
                i === activeIndex
                  ? "bg-accent-muted text-foreground"
                  : "text-foreground/90 hover:bg-secondary",
              )}
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="font-medium">{opt.name}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
