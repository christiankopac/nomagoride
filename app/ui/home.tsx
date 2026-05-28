import { css } from 'remix/ui'

import { todayISO } from '../lib/format.ts'
import { Document } from './document.tsx'
import { StationCombobox } from '../assets/station-combobox.tsx'

export interface HomePageProps {
  initialFromId: string
  initialToId: string
  initialDate: string
}

export function HomePage() {
  return ({ initialFromId, initialToId, initialDate }: HomePageProps) => {
    const date = initialDate || todayISO()
    return (
      <Document>
        <section mix={heroStyle}>
          <p mix={eyebrowStyle}>
            <span mix={eyebrowDotStyle} aria-hidden />
            Slovenian intercity bus search
          </p>
          <h1 mix={h1Style}>
            Bus schedules,{' '}
            <span mix={accentTextStyle}>finally legible.</span>
          </h1>
          <p mix={subStyle}>
            Two stations, one date, every departure. Filter, sort, share — no dense
            cards, no carousels, no nonsense.
          </p>
        </section>

        <form action="/schedule" method="get" mix={searchCardStyle}>
          <div mix={rowStyle}>
            <StationCombobox name="from" label="From" placeholder="e.g. Ljubljana" initialId={initialFromId} />
            <StationCombobox name="to" label="To" placeholder="e.g. Maribor" initialId={initialToId} />
          </div>
          <div mix={dateRowStyle}>
            <label mix={labelStyle}>
              <span>Date</span>
              <input type="date" name="date" defaultValue={date} min={todayISO()} mix={inputStyle} />
            </label>
            <button type="submit" mix={primaryButtonStyle}>
              Find buses →
            </button>
          </div>
        </form>

        <section mix={manifestoStyle}>
          <h2 mix={manifestoHeadStyle}>
            Why bother? <span mix={mutedInlineStyle}>three perfectly reasonable reasons.</span>
          </h2>
          <div mix={manifestoGridStyle}>
            {[
              { tag: 'the planet', text: "Cars exhaust everything. Buses don't." },
              { tag: 'the eyes', text: "Their UX missed the bus. We didn't." },
              { tag: 'the sense', text: 'Cars make traffic. Buses make sense.' },
            ].map((m) => (
              <div mix={cardStyle} key={m.tag}>
                <div mix={tagStyle}>{m.tag}</div>
                <p mix={cardTextStyle}>{m.text}</p>
              </div>
            ))}
          </div>
        </section>
      </Document>
    )
  }
}

const heroStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  paddingBottom: '16px',
})

const eyebrowStyle = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  alignSelf: 'flex-start',
  margin: 0,
  padding: '4px 12px',
  fontSize: '12px',
  fontWeight: 500,
  color: 'var(--muted)',
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '999px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
})

const eyebrowDotStyle = css({
  width: '6px',
  height: '6px',
  borderRadius: '999px',
  background: 'var(--accent)',
})

const h1Style = css({
  margin: 0,
  fontSize: 'clamp(36px, 6vw, 60px)',
  lineHeight: 1.04,
  letterSpacing: '-0.035em',
  fontWeight: 600,
  textWrap: 'balance',
})

const accentTextStyle = css({
  background: 'linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 60%, transparent))',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
})

const subStyle = css({
  margin: 0,
  maxWidth: '640px',
  color: 'var(--muted)',
  fontSize: '17px',
  textWrap: 'balance',
})

const searchCardStyle = css({
  marginTop: '20px',
  padding: '16px',
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '20px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  '@media (min-width: 640px)': { padding: '20px' },
})

const rowStyle = css({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '12px',
  '@media (min-width: 640px)': { gridTemplateColumns: '1fr 1fr' },
})

const dateRowStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  '@media (min-width: 640px)': { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
})

const labelStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  fontSize: '12px',
  fontWeight: 500,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  '& > span': { display: 'block' },
})

const inputStyle = css({
  appearance: 'none',
  width: '100%',
  height: '44px',
  padding: '0 12px',
  fontSize: '15px',
  fontFamily: 'inherit',
  color: 'var(--fg)',
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  '&:focus': { outline: '2px solid var(--accent)', outlineOffset: '2px' },
})

const primaryButtonStyle = css({
  appearance: 'none',
  height: '48px',
  padding: '0 20px',
  border: 0,
  borderRadius: '12px',
  background: 'var(--accent)',
  color: '#ffffff',
  fontFamily: 'inherit',
  fontSize: '15px',
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 1px 2px rgba(0,0,0,0.08), 0 0 0 0 color-mix(in srgb, var(--accent) 30%, transparent)',
  transition: 'box-shadow 200ms ease, transform 80ms ease',
  '&:hover': { boxShadow: '0 1px 2px rgba(0,0,0,0.08), 0 0 0 6px color-mix(in srgb, var(--accent) 18%, transparent)' },
  '&:active': { transform: 'scale(0.97)' },
})

const manifestoStyle = css({
  marginTop: '32px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
})

const manifestoHeadStyle = css({
  margin: 0,
  fontSize: 'clamp(20px, 3vw, 28px)',
  letterSpacing: '-0.02em',
  fontWeight: 600,
})

const mutedInlineStyle = css({
  color: 'var(--muted)',
  fontWeight: 400,
  fontSize: '15px',
})

const manifestoGridStyle = css({
  display: 'grid',
  gap: '12px',
  gridTemplateColumns: '1fr',
  '@media (min-width: 640px)': { gridTemplateColumns: 'repeat(3, 1fr)' },
})

const cardStyle = css({
  padding: '16px',
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '16px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px -12px rgba(0,0,0,0.18)',
    borderColor: 'color-mix(in srgb, var(--fg) 18%, transparent)',
  },
})

const tagStyle = css({
  fontSize: '11px',
  letterSpacing: '0.08em',
  fontWeight: 500,
  textTransform: 'uppercase',
  color: 'var(--muted)',
})

const cardTextStyle = css({
  margin: '6px 0 0',
  fontSize: '15px',
  fontWeight: 500,
  lineHeight: 1.45,
})
