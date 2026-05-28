import {
  clientEntry,
  css,
  ref,
  type Handle,
  type SerializableProps,
} from 'remix/ui'

interface MapPoint {
  name: string
  latitude: number
  longitude: number
  endpoint: boolean
}

interface RouteMapProps extends SerializableProps {
  /** JSON-encoded MapPoint[] — SerializableProps doesn't accept nested object arrays. */
  pointsJson: string
  height?: number
}

const STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/positron'
const STYLE_DARK = 'https://tiles.openfreemap.org/styles/dark'

declare global {
  interface Window {
    maplibregl?: typeof import('maplibre-gl')
  }
}

async function waitForMaplibre(
  signal: AbortSignal,
): Promise<typeof import('maplibre-gl') | null> {
  if (window.maplibregl) return window.maplibregl
  return new Promise((resolve) => {
    const start = Date.now()
    const tick = () => {
      if (signal.aborted) return resolve(null)
      if (window.maplibregl) return resolve(window.maplibregl)
      if (Date.now() - start > 6000) return resolve(null)
      requestAnimationFrame(tick)
    }
    tick()
  })
}

export const RouteMap = clientEntry(
  import.meta.url,
  function RouteMap(handle: Handle<RouteMapProps>) {
    const height = handle.props.height ?? 320

    return () => (
      <div
        mix={[
          css({
            width: '100%',
            background: 'var(--card)',
            borderRadius: 'inherit',
            overflow: 'hidden',
          }),
          ref(async (node, signal) => {
            let allPoints: MapPoint[] = []
            try {
              allPoints = JSON.parse(handle.props.pointsJson) as MapPoint[]
            } catch {
              return
            }
            const points = allPoints.filter(
              (p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude),
            )
            if (points.length === 0) return

            const ml = await waitForMaplibre(signal)
            if (!ml || signal.aborted) return

            const isDark = (): boolean =>
              window.matchMedia('(prefers-color-scheme: dark)').matches

            const map = new ml.Map({
              container: node,
              style: isDark() ? STYLE_DARK : STYLE_LIGHT,
              center: [points[0].longitude, points[0].latitude],
              zoom: 11,
              attributionControl: { compact: true },
              cooperativeGestures: true,
            })

            map.addControl(
              new ml.NavigationControl({ showCompass: false }),
              'top-right',
            )

            const markers: InstanceType<typeof ml.Marker>[] = []

            function buildOverlay() {
              if (!ml) return
              const coords = points.map(
                (p) => [p.longitude, p.latitude] as [number, number],
              )
              try {
                map.addSource('route', {
                  type: 'geojson',
                  data: {
                    type: 'Feature',
                    properties: {},
                    geometry: { type: 'LineString', coordinates: coords },
                  },
                })
                map.addLayer({
                  id: 'route-shadow',
                  type: 'line',
                  source: 'route',
                  layout: { 'line-cap': 'round', 'line-join': 'round' },
                  paint: {
                    'line-color': isDark() ? '#000000' : '#ffffff',
                    'line-width': 6,
                    'line-opacity': 0.5,
                  },
                })
                map.addLayer({
                  id: 'route-line',
                  type: 'line',
                  source: 'route',
                  layout: { 'line-cap': 'round', 'line-join': 'round' },
                  paint: {
                    'line-color': 'hsl(18, 95%, 56%)',
                    'line-width': 3.5,
                  },
                })
              } catch (_) {
                // already added
              }

              for (const m of markers) m.remove()
              markers.length = 0
              for (const p of points) {
                const el = document.createElement('div')
                const isEnd = p.endpoint
                el.style.cssText = `
                  width: ${isEnd ? 14 : 9}px;
                  height: ${isEnd ? 14 : 9}px;
                  border-radius: 9999px;
                  background: ${isEnd ? 'hsl(18, 95%, 56%)' : isDark() ? '#e4e4e7' : '#27272a'};
                  border: ${isEnd ? 3 : 2}px solid ${isDark() ? '#0a0a0a' : '#ffffff'};
                  box-shadow: 0 2px 6px rgba(0,0,0,${isDark() ? 0.6 : 0.25});
                `
                const popup = new ml.Popup({
                  offset: 12,
                  closeButton: false,
                }).setText(p.name)
                const m = new ml.Marker({ element: el })
                  .setLngLat([p.longitude, p.latitude])
                  .setPopup(popup)
                  .addTo(map)
                markers.push(m)
              }

              if (coords.length >= 2) {
                const bounds = coords.reduce(
                  (b, c) => b.extend(c),
                  new ml.LngLatBounds(coords[0], coords[0]),
                )
                map.fitBounds(bounds, { padding: 56, duration: 0, maxZoom: 14 })
              }
            }

            map.on('load', buildOverlay)

            const mql = window.matchMedia('(prefers-color-scheme: dark)')
            const onTheme = () => {
              map.setStyle(isDark() ? STYLE_DARK : STYLE_LIGHT)
              map.once('styledata', buildOverlay)
            }
            mql.addEventListener('change', onTheme)

            signal.addEventListener('abort', () => {
              mql.removeEventListener('change', onTheme)
              for (const m of markers) m.remove()
              map.remove()
            })
          }),
        ]}
        style={{ height: `${height}px` }}
      />
    )
  },
)
