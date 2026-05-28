import { createController } from 'remix/router'

import { assetServer } from '../assets.ts'
import { routes } from '../routes.ts'
import { HomePage } from '../ui/home.tsx'
import { SchedulePage, type SchedulePageProps } from '../ui/schedule.tsx'
import { TripPage, type TripPageProps } from '../ui/trip.tsx'
import { findById, findByName, search as searchStations } from '../lib/stations.server.ts'
import { getSchedule, ScrapeShapeChanged } from '../lib/schedule.server.ts'
import { nowInLjubljana } from '../lib/format.ts'

export default createController(routes, {
  actions: {
    async assets(context) {
      return (
        (await assetServer.fetch(context.request)) ??
        new Response('Not Found', { status: 404 })
      )
    },

    home(context) {
      const url = new URL(context.request.url)
      const fromId = url.searchParams.get('from') ?? ''
      const toId = url.searchParams.get('to') ?? ''
      const date = url.searchParams.get('date') ?? ''
      return context.render(
        <HomePage initialFromId={fromId} initialToId={toId} initialDate={date} />,
      )
    },

    async schedule(context) {
      const url = new URL(context.request.url)
      const fromId = url.searchParams.get('from') ?? ''
      const toId = url.searchParams.get('to') ?? ''
      const date = url.searchParams.get('date') ?? ''

      // Missing params → send user back to the search form instead of a 400.
      if (!fromId || !toId || !date) {
        return new Response(null, { status: 303, headers: { Location: '/' } })
      }

      const [fromStation, toStation] = await Promise.all([
        findById(fromId),
        findById(toId),
      ])
      if (!fromStation || !toStation) {
        return new Response('Unknown station id', { status: 404 })
      }

      try {
        const schedule = await getSchedule({ fromId, toId, date })

        // Canonical stop list = longest entry's stops, coords resolved by name.
        const props: SchedulePageProps = {
          fromStation: {
            id: fromStation.id,
            name: fromStation.name,
            latitude: fromStation.latitude ?? null,
            longitude: fromStation.longitude ?? null,
          },
          toStation: {
            id: toStation.id,
            name: toStation.name,
            latitude: toStation.latitude ?? null,
            longitude: toStation.longitude ?? null,
          },
          date,
          entries: schedule.entries,
          sourceUrl: schedule.sourceUrl,
          now: nowInLjubljana(),
          routeStops: [],
        }

        if (schedule.entries.length > 0) {
          const longest = schedule.entries.reduce((best, e) =>
            e.stops.length > best.stops.length ? e : best,
          )
          const resolved = await Promise.all(
            longest.stops.map(async (s) => ({
              name: s.name,
              station: await findByName(s.name),
            })),
          )
          const stops = resolved
            .filter(
              (r) =>
                r.station?.latitude !== undefined &&
                r.station?.longitude !== undefined &&
                Number.isFinite(r.station.latitude) &&
                Number.isFinite(r.station.longitude),
            )
            .map((r, i, arr) => ({
              name: r.name,
              latitude: r.station!.latitude!,
              longitude: r.station!.longitude!,
              endpoint: i === 0 || i === arr.length - 1,
            }))
          if (stops.length >= 2) props.routeStops = stops
        }
        if (props.routeStops.length < 2) {
          const fallback: SchedulePageProps['routeStops'] = []
          if (
            fromStation.latitude !== undefined &&
            fromStation.longitude !== undefined
          ) {
            fallback.push({
              name: fromStation.name,
              latitude: fromStation.latitude,
              longitude: fromStation.longitude,
              endpoint: true,
            })
          }
          if (toStation.latitude !== undefined && toStation.longitude !== undefined) {
            fallback.push({
              name: toStation.name,
              latitude: toStation.latitude,
              longitude: toStation.longitude,
              endpoint: true,
            })
          }
          props.routeStops = fallback
        }

        return context.render(<SchedulePage {...props} />)
      } catch (err) {
        if (err instanceof ScrapeShapeChanged) {
          return new Response(err.message, { status: 502 })
        }
        throw err
      }
    },

    async trip(context) {
      const url = new URL(context.request.url)
      const tripId = context.params.tripId
      const fromId = url.searchParams.get('from') ?? ''
      const toId = url.searchParams.get('to') ?? ''
      const date = url.searchParams.get('date') ?? ''
      if (!tripId) {
        return new Response(null, { status: 303, headers: { Location: '/' } })
      }
      if (!fromId || !toId || !date) {
        return new Response(null, { status: 303, headers: { Location: '/' } })
      }

      const [fromStation, toStation, schedule] = await Promise.all([
        findById(fromId),
        findById(toId),
        getSchedule({ fromId, toId, date }),
      ])
      if (!fromStation || !toStation) {
        return new Response('Unknown station id', { status: 404 })
      }

      const entry = schedule.entries.find((e) => e.tripId === tripId)
      if (!entry) {
        return new Response('Trip not found for this date.', { status: 404 })
      }

      const mapPoints: TripPageProps['mapPoints'] = []
      for (let i = 0; i < entry.stops.length; i++) {
        const stop = entry.stops[i]
        const station = await findByName(stop.name)
        if (
          station?.latitude !== undefined &&
          station?.longitude !== undefined &&
          Number.isFinite(station.latitude) &&
          Number.isFinite(station.longitude)
        ) {
          mapPoints.push({
            name: stop.name,
            latitude: station.latitude,
            longitude: station.longitude,
            endpoint: i === 0 || i === entry.stops.length - 1,
          })
        }
      }
      if (mapPoints.length < 2) {
        mapPoints.length = 0
        if (
          fromStation.latitude !== undefined &&
          fromStation.longitude !== undefined
        ) {
          mapPoints.push({
            name: fromStation.name,
            latitude: fromStation.latitude,
            longitude: fromStation.longitude,
            endpoint: true,
          })
        }
        if (toStation.latitude !== undefined && toStation.longitude !== undefined) {
          mapPoints.push({
            name: toStation.name,
            latitude: toStation.latitude,
            longitude: toStation.longitude,
            endpoint: true,
          })
        }
      }

      const backHref = `/schedule?from=${encodeURIComponent(fromId)}&to=${encodeURIComponent(toId)}&date=${encodeURIComponent(date)}`

      return context.render(
        <TripPage entry={entry} date={date} mapPoints={mapPoints} backHref={backHref} />,
      )
    },

    async apiStations(context) {
      const url = new URL(context.request.url)
      const q = url.searchParams.get('q') ?? ''
      if (q.trim().length < 2) {
        return Response.json([], {
          headers: { 'Cache-Control': 'public, max-age=60' },
        })
      }
      const matches = await searchStations(q, 10)
      return Response.json(
        matches.map((m) => ({ id: m.id, name: m.name })),
        { headers: { 'Cache-Control': 'public, max-age=300' } },
      )
    },
  },
})
