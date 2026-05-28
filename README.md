# Nomago Ride

A better browser for Slovenian intercity bus timetables, built on top of Nomago's public data.

> Nomago's official timetable engaged in a long and dignified battle with usability and lost, decisively, somewhere around 2009. This is an attempt to do better.

## Why

- **the planet** — Cars exhaust everything. Buses don't.
- **the eyes** — Their UX missed the bus. We didn't.
- **the sense** — Cars make traffic. Buses make sense.

## What it does

- Type two stations, pick a date, see every departure for the day.
- Real filters: hide already-departed, direct-only, time-of-day buckets, max duration.
- Real sort: earliest / fastest, with a sliding indicator instead of dropdowns.
- Per-stop intermediate timeline on each trip.
- A proper map with the full route polyline and stop markers (MapLibre + OpenFreeMap, no token).
- Star a route to pin it to the landing page; clicking a star jumps to today's schedule for that pair.
- Permalinks: every search is a shareable URL.
- Light / dark / system theme with no-flash bootstrap.

## Stack

- [Remix](https://remix.run/) (Vite template) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) with CSS-variable design tokens (shadcn-style)
- [cheerio](https://cheerio.js.org/) for server-side HTML parsing
- [Zod](https://zod.dev/) for validating scraped and external shapes
- [MapLibre GL](https://maplibre.org/) + [OpenFreeMap](https://openfreemap.org/) for vector maps
- [lucide-react](https://lucide.dev/) for icons
- [Geist](https://vercel.com/font) for type

No backend, no database, no API key, no tracker. State that belongs to the user (favourites, theme) lives in `localStorage`.

## How it works

There are two public Nomago endpoints we lean on, neither of which requires authentication:

1. **Stations** — `destinations-iplus-sl.json` (~1 MB, ~3,800 entries) hosted at `nomago.si`. Loaded once per server process, kept in memory, indexed by `dest_code` (the ID format used in the schedule URLs) and by a diacritic-insensitive name slug for autocomplete and stop lookup.
2. **Schedule** — server-rendered HTML at `vozovnice.nomago.si/results/vozni-red/{from}/{to}?date=…`. Fetched server-side, parsed with cheerio against a typed selector map, validated with Zod, and cached for 15 minutes per `(from, to, date)` triple.

If Nomago changes their HTML, the parser fails loudly with a `ScrapeShapeChanged` error instead of rendering garbage.

### Routes

| Route | Purpose |
| --- | --- |
| `/` | Search form, favourites, manifesto |
| `/schedule?from=…&to=…&date=…` | Filtered, sortable schedule + route map |
| `/trip/$tripId?from=…&to=…&date=…` | Single trip detail with stops timeline and map |
| `/api/stations?q=…` | JSON resource route for the autocomplete |

## Getting started

```bash
npm install
npm run dev
```

The dev server starts on `http://localhost:5173`. No environment variables required.

Other scripts:

```bash
npm run typecheck   # tsc -b
npm run build       # remix vite:build
npm run start       # remix-serve ./build/server/index.js
```

Requires Node 20+.

## Project layout

```
app/
├── root.tsx                       Tailwind shell, theme bootstrap, error boundary
├── tailwind.css                   Design tokens (light/dark), utilities
├── routes/
│   ├── _index.tsx                 Landing: search, favourites, manifesto
│   ├── schedule.tsx               Day schedule, filters, sort, route map
│   ├── trip.$tripId.tsx           Trip detail, stops timeline, full map
│   └── api.stations.tsx           Autocomplete JSON
├── lib/
│   ├── stations.server.ts         Loads + indexes destinations-iplus-sl.json
│   ├── schedule.server.ts         Fetch + cheerio parse + Zod + TTL cache
│   ├── cache.server.ts            Small LRU with TTL
│   ├── favorites.ts               localStorage-backed favourites + pub/sub
│   ├── theme.ts                   Theme persistence + no-flash bootstrap script
│   ├── format.ts                  Duration, time-of-day buckets, dates, Ljubljana clock
│   └── cn.ts                      clsx + tailwind-merge helper
└── components/
    ├── ui/                        Primitives: Button, Card, Badge, Input, Label, Separator
    ├── StationCombobox.tsx
    ├── DateChips.tsx
    ├── ScheduleEntry.tsx
    ├── StopsTimeline.tsx
    ├── Filters.tsx
    ├── SortTabs.tsx
    ├── FavoritesList.tsx
    ├── SaveRouteButton.tsx
    ├── ThemeToggle.tsx
    ├── RouteMap.tsx               MapLibre wrapper, theme-aware
    └── HeroIllustration.tsx       Animated SVG hero
```

## Theme

The design tokens are defined as HSL CSS variables in `app/tailwind.css` and consumed via `tailwind.config.ts` (`bg-card`, `text-muted-foreground`, etc.). The dark palette lives under `.dark`. The theme class is set by an inline `<script>` in `root.tsx` before React hydrates, so there's no flash. Tweak the palette by editing the variables — nothing else needs to change.

## Caveats

- This is an unofficial project. It is not affiliated with, endorsed by, or supported by Nomago.
- The schedule is read by parsing the public results page. If Nomago redesigns it, parsing will break and you'll see a clear `502` error rather than wrong data.
- Cached responses are kept in memory for 15 minutes per query — restart the server to clear.
- The map shows intermediate stops resolved by name from the stations JSON. Most resolve exactly; a small fraction fall back to a prefix or substring match. The polyline is drawn from the entry with the most intermediate stops on the day (typically the all-stops variant of the line).

## Out of scope

- Booking, seat selection, payments — use Nomago's site for that.
- Multi-language UI. Station names come through in Slovenian.
- Live tracking.
- A native app.

## License

MIT for the code in this repository. Schedule data belongs to Nomago.
