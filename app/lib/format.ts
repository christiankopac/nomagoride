export function formatDurationMinutes(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes < 0) return "—";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function hhmmToMinutes(hhmm: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 47 || m > 59) return null;
  return h * 60 + m;
}

export type TimeBucket = "early" | "morning" | "afternoon" | "evening" | "night";

export function bucketForTime(hhmm: string): TimeBucket | null {
  const mins = hhmmToMinutes(hhmm);
  if (mins === null) return null;
  const h = Math.floor(mins / 60) % 24;
  if (h < 6) return "early";
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 21) return "evening";
  return "night";
}

export const BUCKET_LABELS: Record<TimeBucket, string> = {
  early: "Early (00–06)",
  morning: "Morning (06–12)",
  afternoon: "Afternoon (12–17)",
  evening: "Evening (17–21)",
  night: "Night (21–24)",
};

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function shiftISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Current date+time in Europe/Ljubljana, returned as ISO date and HH:MM. */
export function nowInLjubljana(): { dateISO: string; hhmm: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Ljubljana",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    dateISO: `${get("year")}-${get("month")}-${get("day")}`,
    hhmm: `${get("hour") === "24" ? "00" : get("hour")}:${get("minute")}`,
  };
}

export function nextSaturdayISO(from: string = todayISO()): string {
  const [y, m, d] = from.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = dt.getUTCDay();
  const daysUntilSat = (6 - dow + 7) % 7 || 7;
  return shiftISO(from, daysUntilSat);
}
