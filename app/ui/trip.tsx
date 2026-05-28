import { css } from 'remix/ui'

import type { ScheduleEntry as Entry } from '../lib/schedule.server.ts'
import { formatDurationMinutes } from '../lib/format.ts'
import { Document } from './document.tsx'
import { RouteMap } from '../assets/route-map.tsx'

export interface MapPoint {
  name: string
  latitude: number
  longitude: number
  endpoint: boolean
}

export interface TripPageProps {
  entry: Entry
  date: string
  backHref: string
  mapPoints: MapPoint[]
}

export function TripPage() {
  return ({ entry, date, backHref, mapPoints }: TripPageProps) => (
    <Document
      title={`${entry.departure.city} → ${entry.arrival.city} · ${entry.departure.time}`}
    >
      <a href={backHref} rmx-document="" mix={backStyle}>
        ← Back to schedule
      </a>

      <section mix={cardStyle}>
        <div mix={eyebrowStyle}>
          Trip · <span className="mono">{date}</span>
        </div>
        <h1 mix={h1Style}>
          <span>{entry.departure.city}</span>
          <span mix={arrowStyle} aria-hidden>
            →
          </span>
          <span>{entry.arrival.city}</span>
        </h1>
        <div mix={timesRowStyle}>
          <div>
            <div className="mono" mix={bigTimeStyle}>
              {entry.departure.time}
            </div>
            <div mix={smallLabelStyle}>Departure</div>
          </div>
          <div mix={centerColStyle}>
            <div mix={durationStyle}>{formatDurationMinutes(entry.durationMinutes)}</div>
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
          <div style={{ textAlign: 'right' }}>
            <div className="mono" mix={bigTimeStyle}>
              {entry.arrival.time}
            </div>
            <div mix={smallLabelStyle}>Arrival</div>
          </div>
        </div>
      </section>

      {mapPoints.length >= 2 ? (
        <section mix={mapCardStyle} aria-label="Route map">
          <RouteMap pointsJson={JSON.stringify(mapPoints)} height={360} />
        </section>
      ) : null}

      <section mix={cardStyle}>
        <h2 mix={sectionHeadStyle}>Stops</h2>
        <ol mix={timelineStyle}>
          {entry.stops.map((s, i) => {
            const endpoint = i === 0 || i === entry.stops.length - 1
            return (
              <li key={`${s.name}-${i}`} mix={liStyle}>
                <span
                  aria-hidden
                  mix={pinStyle}
                  style={{ background: endpoint ? 'var(--accent)' : 'var(--muted)' }}
                />
                <div mix={stopRowStyle}>
                  <span style={{ fontWeight: endpoint ? 600 : 400 }}>{s.name}</span>
                  <span className="mono" mix={mutedMonoStyle}>
                    {s.arrival ? s.arrival : null}
                    {s.arrival && s.departure ? <span style={{ color: 'var(--border)' }}> · </span> : null}
                    {s.departure ? s.departure : null}
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      </section>
    </Document>
  )
}

function RoutePreview() {
  return ({ points }: { points: MapPoint[] }) => {
    const lats = points.map((p) => p.latitude)
    const lons = points.map((p) => p.longitude)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLon = Math.min(...lons)
    const maxLon = Math.max(...lons)
    const pad = 0.001
    const w = 800
    const h = 320
    const range = (v: number, lo: number, hi: number) => (v - lo) / (hi - lo || 1)
    const proj = (p: MapPoint): [number, number] => [
      40 + range(p.longitude, minLon - pad, maxLon + pad) * (w - 80),
      h - 40 - range(p.latitude, minLat - pad, maxLat + pad) * (h - 80),
    ]
    const coords = points.map(proj)
    const d = coords
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c[0].toFixed(1)} ${c[1].toFixed(1)}`)
      .join(' ')
    return (
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" mix={svgStyle}>
        <path d={d} stroke="var(--accent)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c, i) => {
          const endpoint = points[i].endpoint
          return (
            <g key={i}>
              <circle
                cx={c[0]}
                cy={c[1]}
                r={endpoint ? 7 : 4}
                fill={endpoint ? 'var(--accent)' : 'var(--muted)'}
                stroke="var(--card)"
                strokeWidth="2"
              />
              <text
                x={c[0]}
                y={c[1] - 12}
                fontSize="10"
                fontFamily="Geist, sans-serif"
                fill="var(--fg)"
                textAnchor="middle"
                style={{ pointerEvents: 'none' }}
              >
                {points[i].name}
              </text>
            </g>
          )
        })}
      </svg>
    )
  }
}

const backStyle = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '13px',
  color: 'var(--muted)',
  textDecoration: 'none',
  marginBottom: '16px',
  '&:hover': { color: 'var(--fg)' },
})

const cardStyle = css({
  padding: '24px',
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '20px',
  marginBottom: '16px',
})

const mapCardStyle = css({
  padding: 0,
  height: '320px',
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '20px',
  marginBottom: '16px',
  overflow: 'hidden',
})

const svgStyle = css({ display: 'block', width: '100%', height: '100%' })

const eyebrowStyle = css({
  fontSize: '12px',
  fontWeight: 500,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
})

const h1Style = css({
  margin: '8px 0 0',
  fontSize: 'clamp(22px, 3vw, 28px)',
  letterSpacing: '-0.02em',
  fontWeight: 600,
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '8px',
})

const arrowStyle = css({ color: 'var(--muted)', fontWeight: 400 })

const timesRowStyle = css({
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  gap: '16px',
  alignItems: 'center',
  marginTop: '24px',
})

const bigTimeStyle = css({
  fontSize: '32px',
  fontWeight: 600,
  letterSpacing: '-0.04em',
  lineHeight: 1,
})

const smallLabelStyle = css({
  marginTop: '6px',
  fontSize: '11px',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
})

const centerColStyle = css({
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
})

const durationStyle = css({
  fontSize: '13px',
  fontWeight: 500,
  fontFamily: '"Geist Mono", monospace',
})

const badgeStyle = css({
  padding: '2px 10px',
  fontSize: '11px',
  fontWeight: 500,
  letterSpacing: '0.04em',
  textTransform: 'lowercase',
  borderRadius: '999px',
})

const sectionHeadStyle = css({
  margin: '0 0 12px',
  fontSize: '12px',
  letterSpacing: '0.06em',
  fontWeight: 500,
  textTransform: 'uppercase',
  color: 'var(--muted)',
})

const timelineStyle = css({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  position: 'relative',
  borderLeft: '2px solid var(--border)',
  paddingLeft: '16px',
})

const liStyle = css({
  position: 'relative',
  padding: '0 0 16px 4px',
  '&:last-child': { paddingBottom: 0 },
})

const pinStyle = css({
  position: 'absolute',
  left: '-23px',
  top: '6px',
  width: '10px',
  height: '10px',
  borderRadius: '999px',
  border: '2px solid var(--bg)',
})

const stopRowStyle = css({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: '12px',
  fontSize: '14px',
})

const mutedMonoStyle = css({
  color: 'var(--muted)',
  fontSize: '12px',
})
