import { clientEntry, css, on, type Handle, type SerializableProps } from 'remix/ui'

import * as favorites from './favorites.ts'
import { todayISO } from '../lib/format.ts'

interface FavoritesListProps extends SerializableProps {}

export const FavoritesList = clientEntry(
  import.meta.url,
  function FavoritesList(handle: Handle<FavoritesListProps>) {
    // Start empty so SSR + first client render match.
    let list: ReturnType<typeof favorites.getAll> = []

    handle.queueTask(() => {
      list = favorites.getAll()
      handle.update()
    })

    const unsubscribe = favorites.subscribe(() => {
      list = favorites.getAll()
      handle.update()
    })
    handle.signal.addEventListener('abort', unsubscribe)

    return () => {
      const today = todayISO()
      const empty = list.length === 0
      return (
        <section
          mix={wrapStyle}
          aria-label="Favorite rides"
          style={{ display: empty ? 'none' : undefined }}
        >
          <div mix={headerStyle}>
            <span mix={starStyle} aria-hidden>
              ★
            </span>
            <h2 mix={headStyle}>Favorite rides</h2>
            <span mix={dimStyle}>— from today onward</span>
          </div>
          <ul mix={listStyle}>
            {list.map((f) => {
              const href = `/schedule?from=${encodeURIComponent(f.from.id)}&to=${encodeURIComponent(f.to.id)}&date=${today}`
              return (
                <li key={`${f.from.id}-${f.to.id}`} mix={pillStyle}>
                  <a href={href} mix={pillLinkStyle}>
                    <span>{f.from.name}</span>
                    <span mix={arrowStyle} aria-hidden>
                      →
                    </span>
                    <span>{f.to.name}</span>
                  </a>
                  <button
                    type="button"
                    aria-label="Remove favorite"
                    mix={[
                      pillRemoveStyle,
                      on('click', () => {
                        favorites.remove(f.from.id, f.to.id)
                      }),
                    ]}
                  >
                    ×
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )
    }
  },
)

const wrapStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginTop: '16px',
})

const headerStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
})

const starStyle = css({
  color: 'var(--accent)',
  fontSize: '14px',
})

const headStyle = css({
  margin: 0,
  fontSize: '11px',
  fontWeight: 500,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
})

const dimStyle = css({
  fontSize: '12px',
  color: 'var(--muted)',
})

const listStyle = css({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
})

const pillStyle = css({
  display: 'flex',
  alignItems: 'center',
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '999px',
  overflow: 'hidden',
  transition: 'border-color 180ms ease, box-shadow 180ms ease',
  '&:hover': {
    borderColor: 'color-mix(in srgb, var(--accent) 50%, transparent)',
    boxShadow: '0 4px 12px -6px rgba(0,0,0,0.18)',
  },
})

const pillLinkStyle = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 14px',
  fontSize: '14px',
  fontWeight: 500,
  textDecoration: 'none',
  color: 'var(--fg)',
})

const arrowStyle = css({ color: 'var(--muted)' })

const pillRemoveStyle = css({
  appearance: 'none',
  height: '100%',
  width: '32px',
  padding: '8px 0',
  border: 0,
  background: 'transparent',
  color: 'var(--muted)',
  fontSize: '14px',
  fontFamily: 'inherit',
  cursor: 'pointer',
  '&:hover': {
    background: 'color-mix(in srgb, var(--fg) 6%, transparent)',
    color: 'var(--fg)',
  },
})
