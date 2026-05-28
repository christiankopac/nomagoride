import { css } from 'remix/ui'

import type { ScheduleEntry as Entry } from '../lib/schedule.server.ts'
import { formatDurationMinutes, shiftISO } from '../lib/format.ts'
import { Document } from './document.tsx'

export interface MapPoint {
  name: string
  latitude: number
  longitude: number
  endpoint: boolean
}

export interface SchedulePageProps {
  fromStation: { id: string; name: string; latitude: number | null; longitude: number | null }
  toStation: { id: string; name: string; latitude: number | null; longitude: number | null }
  date: string
  entries: Entry[]
  sourceUrl: string
  now: { dateISO: string; hhmm: string }
  routeStops: MapPoint[]
}

export function SchedulePage() {
  return ({ fromStation, toStation, date, entries, sourceUrl, now, routeStops }: SchedulePageProps) => {
    const isPast = (hhmm: string): boolean => {
      if (date < now.dateISO) return true
      if (date > now.dateISO) return false
      return hhmm < now.hhmm
    }
    const visible = entries.filter((e) => !isPast(e.departure.time))
    visible.sort((a, b) => a.departure.time.localeCompare(b.departure.time))

    const prevDay = shiftISO(date, -1)
    const nextDay = shiftISO(date, 1)
    const linkFor = (d: string) =>
      `/schedule?from=${encodeURIComponent(fromStation.id)}&to=${encodeURIComponent(toStation.id)}&date=${encodeURIComponent(d)}`

    return (
      <Document title={`${fromStation.name} → ${toStation.name} · ${date}`}>
        <header mix={headerStyle}>
          <div>
            <div mix={eyebrowStyle}>Schedule</div>
            <h1 mix={h1Style}>
              <span>{fromStation.name}</span>
              <span mix={arrowStyle} aria-hidden>
                →
              </span>
              <span>{toStation.name}</span>
            </h1>
            <div mix={dayNavStyle}>
              <a href={linkFor(prevDay)} mix={dayBtnStyle} aria-label="Previous day">
                ←
              </a>
              <span className="mono" mix={dayLabelStyle}>
                {date}
              </span>
              <a href={linkFor(nextDay)} mix={dayBtnStyle} aria-label="Next day">
                →
              </a>
            </div>
          </div>
          <form action="/" method="get">
            <input type="hidden" name="from" value={fromStation.id} />
            <input type="hidden" name="to" value={toStation.id} />
            <input type="hidden" name="date" value={date} />
            <button type="submit" mix={outlineButtonStyle}>
              Edit search
            </button>
          </form>
        </header>

        {routeStops.length >= 2 ? (
          <div mix={mapPlaceholderStyle} aria-label="Route preview">
            <RoutePreviewSVG points={routeStops} />
          </div>
        ) : null}

        <div mix={metaRowStyle}>
          <div>
            <strong className="mono">{visible.length}</strong>{' '}
            <span mix={mutedStyle}>
              {visible.length === 1 ? 'departure' : 'departures'} ahead today
            </span>
          </div>
          {entries.length - visible.length > 0 ? (
            <span mix={mutedStyle}>
              {entries.length - visible.length} already departed
            </span>
          ) : null}
        </div>

        {visible.length === 0 ? (
          <div mix={emptyStyle}>
            <strong>No departures remaining for {date}.</strong>
            <p mix={mutedSmallStyle}>Try tomorrow with the → arrow above.</p>
          </div>
        ) : (
          <ul mix={listStyle}>
            {visible.map((e) => (
              <li key={e.tripId}>
                <EntryRow entry={e} fromId={fromStation.id} toId={toStation.id} date={date} />
              </li>
            ))}
          </ul>
        )}

        <p mix={sourceStyle}>
          Data scraped from{' '}
          <a href={sourceUrl} target="_blank" rel="noreferrer">
            the public Nomago page
          </a>
          . Cached 15 minutes per query.
        </p>
      </Document>
    )
  }
}

function EntryRow() {
  return ({
    entry,
    fromId,
    toId,
    date,
  }: {
    entry: Entry
    fromId: string
    toId: string
    date: string
  }) => {
    const href = `/trip/${encodeURIComponent(entry.tripId)}?from=${encodeURIComponent(fromId)}&to=${encodeURIComponent(toId)}&date=${encodeURIComponent(date)}`
    return (
      <a href={href} mix={entryStyle}>
        <div mix={timeSideStyle}>
          <div className="mono" mix={timeStyle}>
            {entry.departure.time}
          </div>
          <div mix={cityStyle}>{entry.departure.city}</div>
        </div>
        <div mix={middleStyle}>
          <div mix={durationStyle}>{formatDurationMinutes(entry.durationMinutes)}</div>
          <div mix={dashStyle} aria-hidden>
            <span style={{ background: 'var(--accent)' }} mix={dotStyle} />
            <span mix={lineStyle} />
            <span style={{ borderLeftColor: 'var(--accent)' }} mix={arrowHeadStyle} />
          </div>
          <span
            mix={badgeStyle}
            style={
              entry.isDirect
                ? { background: 'var(--success-soft)', color: 'var(--success)' }
                : { background: 'var(--warn-soft)', color: 'var(--warn)' }
            }
          >
            {entry.isDirect
              ? 'direct'
              : `${entry.transfers} transfer${entry.transfers === 1 ? '' : 's'}`}
          </span>
        </div>
        <div mix={timeSideStyleRight}>
          <div className="mono" mix={timeStyle}>
            {entry.arrival.time}
          </div>
          <div mix={cityStyle}>{entry.arrival.city}</div>
        </div>
      </a>
    )
  }
}

function RoutePreviewSVG() {
  return ({ points }: { points: MapPoint[] }) => {
    if (points.length < 2) return null
    const lats = points.map((p) => p.latitude)
    const lons = points.map((p) => p.longitude)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLon = Math.min(...lons)
    const maxLon = Math.max(...lons)
    const pad = 0.001
    const w = 800
    const h = 200
    const range = (v: number, lo: number, hi: number) => (v - lo) / (hi - lo || 1)
    const proj = (p: MapPoint): [number, number] => [
      20 + range(p.longitude, minLon - pad, maxLon + pad) * (w - 40),
      h - 20 - range(p.latitude, minLat - pad, maxLat + pad) * (h - 40),
    ]
    const coords = points.map(proj)
    const d = coords
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c[0].toFixed(1)} ${c[1].toFixed(1)}`)
      .join(' ')
    return (
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" mix={svgStyle}>
        <path d={d} stroke="var(--accent)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c, i) => {
          const endpoint = points[i].endpoint
          return (
            <circle
              key={i}
              cx={c[0]}
              cy={c[1]}
              r={endpoint ? 5 : 3}
              fill={endpoint ? 'var(--accent)' : 'var(--muted)'}
              stroke="var(--card)"
              strokeWidth="1.5"
            />
          )
        })}
      </svg>
    )
  }
}

const headerStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  marginBottom: '20px',
  '@media (min-width: 640px)': { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
})

const eyebrowStyle = css({
  fontSize: '12px',
  fontWeight: 500,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
})

const h1Style = css({
  margin: '4px 0 0',
  fontSize: 'clamp(22px, 3vw, 30px)',
  letterSpacing: '-0.02em',
  fontWeight: 600,
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '8px',
})

const arrowStyle = css({
  color: 'var(--muted)',
  fontWeight: 400,
})

const dayNavStyle = css({
  marginTop: '8px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '2px',
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
})

const dayBtnStyle = css({
  display: 'inline-flex',
  width: '28px',
  height: '28px',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '6px',
  textDecoration: 'none',
  color: 'var(--muted)',
  '&:hover': { background: 'color-mix(in srgb, var(--fg) 6%, transparent)', color: 'var(--fg)' },
})

const dayLabelStyle = css({
  padding: '0 8px',
  fontSize: '13px',
})

const outlineButtonStyle = css({
  appearance: 'none',
  height: '40px',
  padding: '0 14px',
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  color: 'var(--fg)',
  fontFamily: 'inherit',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'background 150ms ease',
  '&:hover': { background: 'color-mix(in srgb, var(--fg) 6%, transparent)' },
})

const mapPlaceholderStyle = css({
  height: '200px',
  marginBottom: '16px',
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '16px',
  overflow: 'hidden',
})

const svgStyle = css({ display: 'block', width: '100%', height: '100%' })

const metaRowStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '12px',
  fontSize: '14px',
})

const mutedStyle = css({ color: 'var(--muted)' })
const mutedSmallStyle = css({ color: 'var(--muted)', fontSize: '14px', margin: '4px 0 0' })

const emptyStyle = css({
  padding: '32px',
  textAlign: 'center',
  background: 'var(--card)',
  border: '1px dashed var(--border)',
  borderRadius: '14px',
})

const listStyle = css({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
})

const entryStyle = css({
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  alignItems: 'center',
  gap: '20px',
  padding: '16px 20px',
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '14px',
  textDecoration: 'none',
  color: 'var(--fg)',
  transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 6px 20px -10px rgba(0,0,0,0.18)',
    borderColor: 'color-mix(in srgb, var(--fg) 18%, transparent)',
  },
})

const timeSideStyle = css({ textAlign: 'left', minWidth: 0 })
const timeSideStyleRight = css({ textAlign: 'right', minWidth: 0 })

const timeStyle = css({
  fontSize: '26px',
  fontWeight: 600,
  letterSpacing: '-0.04em',
  lineHeight: 1,
})

const cityStyle = css({
  marginTop: '6px',
  fontSize: '13px',
  color: 'var(--muted)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

const middleStyle = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '6px',
  minWidth: '120px',
})

const durationStyle = css({
  fontSize: '12px',
  color: 'var(--muted)',
  fontFamily: '"Geist Mono", monospace',
})

const dashStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  width: '100%',
})

const dotStyle = css({
  width: '6px',
  height: '6px',
  borderRadius: '999px',
  flex: '0 0 auto',
})

const lineStyle = css({
  flex: '1 1 auto',
  height: '1px',
  background:
    'repeating-linear-gradient(90deg, var(--border) 0 4px, transparent 4px 8px)',
})

const arrowHeadStyle = css({
  width: 0,
  height: 0,
  borderTop: '4px solid transparent',
  borderBottom: '4px solid transparent',
  borderLeft: '6px solid',
  flex: '0 0 auto',
})

const badgeStyle = css({
  padding: '2px 8px',
  fontSize: '11px',
  fontWeight: 500,
  letterSpacing: '0.04em',
  textTransform: 'lowercase',
  borderRadius: '999px',
})

const sourceStyle = css({
  marginTop: '16px',
  fontSize: '12px',
  color: 'var(--muted)',
  '& a': { color: 'var(--muted)', textDecoration: 'underline', textUnderlineOffset: '2px' },
  '& a:hover': { color: 'var(--fg)' },
})
