# Nomago Ride

A better browser for Slovenian intercity bus timetables, built on top of Nomago's public data.

> Nomago's official timetable engaged in a long and dignified battle with usability and lost, decisively, somewhere around 2009. This is an attempt to do better.

## Why

- **the planet** — Cars exhaust everything. Buses don't.
- **the eyes** — Their UX missed the bus. We didn't.
- **the sense** — Cars make traffic. Buses make sense.

## What it does

- Type two stations, pick a date, see every departure for the day.
- Already-departed buses hidden by default; day-stepper to flip through days.
- Per-stop intermediate timeline on each trip.
- Inline route preview (SVG polyline of all stops).
- Permalinks: every search is a shareable URL.
- Light/dark theme via `prefers-color-scheme`.

## Stack

- [**Remix 3**](https://remix.run) (`remix@^3.0.0-beta.2`) — server-first, no React, no bundler. JSX renders through `remix/ui`.
- TypeScript, JSX runtime from `remix/ui`.
- [cheerio](https://cheerio.js.org/) for server-side HTML parsing.
- [Zod](https://zod.dev/) for validating scraped and external shapes.
- CSS-in-JS via `css({...})` from `remix/ui`. Theme tokens are CSS variables on `<body>` with a `prefers-color-scheme: dark` override.
- [Geist](https://vercel.com/font) for type.

No backend, no database, no API key, no tracker. The schedule data comes from public Nomago endpoints — no auth required.

## How it works

Two public Nomago endpoints, neither authenticated:

1. **Stations** — `destinations-iplus-sl.json` (~1 MB, ~3,800 entries) hosted at `nomago.si`. Loaded once per server process, kept in memory, indexed by `dest_code` (the ID format used in the schedule URLs) and by a diacritic-insensitive name slug for autocomplete + stop lookup.
2. **Schedule** — server-rendered HTML at `vozovnice.nomago.si/results/vozni-red/{from}/{to}?date=…`. Fetched server-side, parsed with cheerio against a typed selector map, validated with Zod, cached 15 min per `(from, to, date)`.

If Nomago changes their HTML, the parser fails loudly with a `ScrapeShapeChanged` error instead of rendering garbage.

### Routes

The route contract lives in `app/routes.ts`; each route maps to an action in `app/actions/controller.tsx`.

| Route | Purpose |
| --- | --- |
| `/` | Search form + manifesto |
| `/schedule?from=…&to=…&date=…` | Day schedule + SVG route preview |
| `/trip/:tripId?from=…&to=…&date=…` | Single trip detail with stops timeline + SVG map |
| `/api/stations?q=…` | JSON resource for the autocomplete combobox |
| `/assets/*path` | Asset server (compiled client modules) |

## Getting started

```bash
npm install
npm run dev
```

The dev server starts on `http://localhost:5173` (set `PORT` to override). Requires Node **24.3+** (the Remix 3 runtime).

Other scripts:

```bash
npm run typecheck   # tsc --noEmit
npm run start       # production-style boot (no --watch)
npm run test        # node --test under remix/node-tsx
```

## Project layout

```
app/
├── routes.ts                    Typed URL contract (createRoutes)
├── router.ts                    Router wiring + middleware
├── actions/
│   └── controller.tsx           Route handlers (one action per route key)
├── middleware/
│   └── render.tsx               renderToStream → HTML response
├── assets.ts                    Asset server config (compiles client modules)
├── assets/
│   ├── entry.ts                 Client hydration entry
│   └── station-combobox.tsx     clientEntry: autocomplete combobox
├── ui/
│   ├── document.tsx             Shared shell + theme tokens
│   ├── home.tsx                 Landing page
│   ├── schedule.tsx             Schedule list view
│   └── trip.tsx                 Trip detail view
└── lib/
    ├── stations.server.ts       Loads + indexes destinations-iplus-sl.json
    ├── schedule.server.ts       fetch + cheerio parse + Zod + TTL cache
    ├── cache.server.ts          Small TTL/LRU
    └── format.ts                Duration, time-of-day buckets, Ljubljana clock
public/
└── favicon.svg
server.ts                        Node HTTP entry: createRequestListener(router.fetch)
```

## Deploying

The current entry is a Node server (`server.ts`) — ship it anywhere that runs Node 24+ (Fly.io, Railway, Render, a small VPS).

Cloudflare Workers can run `router.fetch()` directly (the router is fetch-API-shaped), but the asset pipeline (`createAssetServer`) and `staticFiles('./public')` middleware both touch the filesystem, so a Workers deploy needs a custom adapter that serves pre-built assets via Cloudflare's static bindings. That work isn't done yet.

## Theme

Theme tokens (`--bg`, `--fg`, `--muted`, `--card`, `--border`, `--accent`, `--success`, `--warn`) are CSS variables defined on `<body>` in `app/ui/document.tsx`. The `.dark` override is wired via `prefers-color-scheme`. Tweak the variables — nothing else needs to change.

## Caveats

- Unofficial. Not affiliated with, endorsed by, or supported by Nomago.
- The schedule is read by parsing the public results page. If Nomago redesigns it, parsing will break and you'll see a `502` rather than wrong data.
- Cached responses live in process memory for 15 minutes per query — restart to clear.
- Map intermediate stops are resolved by name from the stations JSON. Most resolve exactly; a small fraction fall back to a prefix or substring match. The polyline is drawn from the entry with the most intermediate stops on the day.
- Remix 3 is **beta**; API may shift.

## Out of scope

- Booking, seat selection, payments — use Nomago's site.
- Multi-language UI (station names come through in Slovenian).
- Live tracking.

## License

MIT for the code in this repository. Schedule data belongs to Nomago.
