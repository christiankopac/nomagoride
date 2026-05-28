import { css, type RemixNode } from 'remix/ui'

import { routes } from '../routes.ts'

export interface DocumentProps {
  children?: RemixNode
  head?: RemixNode
  title?: string
}

const DEFAULT_TITLE = 'Nomago Ride — Slovenian bus schedule, the way it should be'

export function Document() {
  return ({ children, head, title = DEFAULT_TITLE }: DocumentProps) => (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap"
        />
        <title>{title}</title>
        {head}
      </head>
      <body mix={bodyStyle}>
        <header mix={headerStyle}>
          <a href="/" mix={brandStyle}>
            <span mix={brandMarkStyle} aria-hidden>
              N
            </span>
            <span>Nomago Ride</span>
          </a>
          <span mix={brandTagStyle}>Data: vozovnice.nomago.si</span>
        </header>
        <main mix={mainStyle}>{children}</main>
        <footer mix={footerStyle}>
          Unofficial. Bus timetable data sourced from{' '}
          <a href="https://vozovnice.nomago.si/" target="_blank" rel="noreferrer">
            vozovnice.nomago.si
          </a>
          . Not affiliated with Nomago.
        </footer>
        <script type="module" src={routes.assets.href({ path: 'app/assets/entry.ts' })}></script>
      </body>
    </html>
  )
}

const FONT_STACK = `Geist, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`
const FONT_MONO = `"Geist Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`

const bodyStyle = css({
  // Light tokens
  '--bg': '#fafafb',
  '--fg': '#0c0d11',
  '--muted': '#5c5f6a',
  '--card': '#ffffff',
  '--border': 'rgba(12, 13, 17, 0.1)',
  '--accent': '#ff5a1f',
  '--accent-soft': '#fff4ef',
  '--success': '#16a34a',
  '--success-soft': '#dcfce7',
  '--warn': '#d97706',
  '--warn-soft': '#fef3c7',
  '@media (prefers-color-scheme: dark)': {
    '--bg': '#0c0d11',
    '--fg': '#e6e7eb',
    '--muted': '#9ca0aa',
    '--card': '#15171c',
    '--border': 'rgba(255, 255, 255, 0.08)',
    '--accent': '#ff7841',
    '--accent-soft': 'rgba(255, 120, 65, 0.12)',
    '--success': '#22c55e',
    '--success-soft': 'rgba(34, 197, 94, 0.14)',
    '--warn': '#f59e0b',
    '--warn-soft': 'rgba(245, 158, 11, 0.14)',
  },
  margin: 0,
  minHeight: '100vh',
  background: `radial-gradient(at 20% -10%, color-mix(in oklch, var(--accent) 8%, transparent), transparent 50%), var(--bg)`,
  color: 'var(--fg)',
  fontFamily: FONT_STACK,
  fontSize: '15px',
  lineHeight: 1.5,
  WebkitFontSmoothing: 'antialiased',
  '& *, & *::before, & *::after': { boxSizing: 'border-box' },
  '& a': { color: 'inherit' },
  '& code, & .mono': { fontFamily: FONT_MONO, fontVariantNumeric: 'tabular-nums' },
})

const headerStyle = css({
  position: 'sticky',
  top: 0,
  zIndex: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  maxWidth: '1024px',
  margin: '0 auto',
  padding: '14px 20px',
  background: 'color-mix(in srgb, var(--bg) 70%, transparent)',
  backdropFilter: 'saturate(180%) blur(10px)',
  WebkitBackdropFilter: 'saturate(180%) blur(10px)',
  borderBottom: '1px solid var(--border)',
})

const brandStyle = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10px',
  textDecoration: 'none',
  fontWeight: 600,
  letterSpacing: '-0.01em',
})

const brandMarkStyle = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '28px',
  height: '28px',
  borderRadius: '8px',
  background: 'var(--accent)',
  color: '#fff',
  fontWeight: 700,
  fontSize: '14px',
})

const brandTagStyle = css({
  fontSize: '12px',
  color: 'var(--muted)',
  '@media (max-width: 640px)': { display: 'none' },
})

const mainStyle = css({
  maxWidth: '1024px',
  margin: '0 auto',
  padding: '32px 20px',
})

const footerStyle = css({
  maxWidth: '1024px',
  margin: '0 auto',
  padding: '12px 20px 32px',
  fontSize: '12px',
  color: 'var(--muted)',
  '& a': { color: 'var(--muted)', textDecoration: 'underline', textUnderlineOffset: '2px' },
  '& a:hover': { color: 'var(--fg)' },
})
