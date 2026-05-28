import { z } from "zod";

const STATIONS_URL =
  "https://www.nomago.si/themes/shuttle/assets/data/destinations-iplus-sl.json?v=1.0.8";

const nullableStr = z.string().nullable().optional();

const RawStationSchema = z.object({
  id: z.string(),
  parent_id: nullableStr,
  name: nullableStr,
  dest_code: nullableStr,
  latitude: nullableStr,
  longitude: nullableStr,
  shuttle: nullableStr,
  vozovnice: nullableStr,
  sort_order: nullableStr,
  intercity: nullableStr,
  status: nullableStr,
  ic_code: nullableStr,
  shuttle_code: nullableStr,
});

export type Station = {
  /** Public ID used in URLs — this is the JSON's `dest_code`. */
  id: string;
  name: string;
  normalized: string;
  latitude?: number;
  longitude?: number;
};

let cached: {
  byId: Map<string, Station>;
  byNormalizedName: Map<string, Station>;
  all: Station[];
} | null = null;
let inFlight: Promise<void> | null = null;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function load(): Promise<void> {
  const res = await fetch(STATIONS_URL, {
    headers: {
      "User-Agent": "NomagoRide/0.1 (+https://github.com/christiankopac/nomagoride)",
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`stations fetch failed: ${res.status}`);
  }
  const raw = await res.json();
  const parsed = z.array(RawStationSchema).parse(raw);

  const byId = new Map<string, Station>();
  for (const r of parsed) {
    if (
      r.vozovnice !== "1" ||
      r.status !== "1" ||
      !r.dest_code ||
      r.dest_code === "99123" ||
      !r.name
    )
      continue;
    if (byId.has(r.dest_code)) continue;
    byId.set(r.dest_code, {
      id: r.dest_code,
      name: r.name,
      normalized: normalize(r.name),
      latitude: r.latitude ? Number(r.latitude) : undefined,
      longitude: r.longitude ? Number(r.longitude) : undefined,
    });
  }
  const byNormalizedName = new Map<string, Station>();
  for (const s of byId.values()) {
    if (!byNormalizedName.has(s.normalized)) byNormalizedName.set(s.normalized, s);
  }
  const all = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "sl"));
  cached = { byId, byNormalizedName, all };
}

async function ensure(): Promise<void> {
  if (cached) return;
  if (inFlight) return inFlight;
  inFlight = load().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

export async function getAll(): Promise<Station[]> {
  await ensure();
  return cached!.all;
}

export async function findById(id: string | number): Promise<Station | undefined> {
  await ensure();
  return cached!.byId.get(String(id));
}

/** Resolve a station by its scraped name. Tries exact normalized match, then prefix, then substring. */
export async function findByName(name: string): Promise<Station | undefined> {
  await ensure();
  const q = normalize(name);
  if (!q) return undefined;
  const exact = cached!.byNormalizedName.get(q);
  if (exact) return exact;
  // The scrape often abbreviates with a trailing period: "Trbovlje trž." → "trbovlje trz"
  // Try prefix match against full names.
  for (const [norm, station] of cached!.byNormalizedName) {
    if (norm.startsWith(q)) return station;
  }
  for (const [norm, station] of cached!.byNormalizedName) {
    if (norm.includes(q)) return station;
  }
  return undefined;
}

export async function search(term: string, limit = 8): Promise<Station[]> {
  await ensure();
  const q = normalize(term);
  if (q.length < 2) return [];
  const all = cached!.all;
  const prefix: Station[] = [];
  const substring: Station[] = [];
  for (const s of all) {
    if (s.normalized.startsWith(q)) {
      prefix.push(s);
      if (prefix.length >= limit) break;
    } else if (s.normalized.includes(q)) {
      substring.push(s);
    }
  }
  return [...prefix, ...substring].slice(0, limit);
}
