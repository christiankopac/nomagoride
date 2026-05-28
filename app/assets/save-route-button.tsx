import { clientEntry, css, on, type Handle, type SerializableProps } from 'remix/ui'

import * as favorites from './favorites.ts'

interface SaveRouteButtonProps extends SerializableProps {
  fromId: string
  fromName: string
  toId: string
  toName: string
}

export const SaveRouteButton = clientEntry(
  import.meta.url,
  function SaveRouteButton(handle: Handle<SaveRouteButtonProps>) {
    // Start as "not saved" so SSR + first client render match.
    let saved = false
    let hydrated = false

    // After first paint, read storage and update if needed.
    handle.queueTask(() => {
      saved = favorites.isSaved(handle.props.fromId, handle.props.toId)
      hydrated = true
      handle.update()
    })

    const unsubscribe = favorites.subscribe(() => {
      saved = favorites.isSaved(handle.props.fromId, handle.props.toId)
      handle.update()
    })
    handle.signal.addEventListener('abort', unsubscribe)

    return () => (
      <button
        type="button"
        aria-pressed={saved}
        title={saved ? 'Remove from favorites' : 'Save this route'}
        mix={[
          css({
            appearance: 'none',
            height: '40px',
            padding: '0 14px',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            fontFamily: 'inherit',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 150ms ease, border-color 150ms ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }),
          on('click', () => {
            if (saved) {
              favorites.remove(handle.props.fromId, handle.props.toId)
            } else {
              favorites.add({
                from: { id: handle.props.fromId, name: handle.props.fromName },
                to: { id: handle.props.toId, name: handle.props.toName },
              })
            }
          }),
        ]}
        style={
          saved
            ? {
                background: 'var(--accent-soft)',
                borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)',
                color: 'var(--accent)',
              }
            : { background: 'var(--card)', color: 'var(--fg)' }
        }
      >
        <span aria-hidden>{!hydrated || !saved ? '☆' : '★'}</span>
        {!hydrated || !saved ? 'Save' : 'Saved'}
      </button>
    )
  },
)
