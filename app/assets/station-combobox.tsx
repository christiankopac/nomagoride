import { clientEntry, css, on, type Handle, type SerializableProps } from 'remix/ui'

interface StationOption {
  id: string
  name: string
}

interface StationComboboxProps extends SerializableProps {
  name: string
  label: string
  placeholder?: string
  initialId?: string
  initialName?: string
}

export const StationCombobox = clientEntry(
  import.meta.url,
  function StationCombobox(handle: Handle<StationComboboxProps>) {
    let query = handle.props.initialName ?? ''
    let selectedId = handle.props.initialId ?? ''
    let options: StationOption[] = []
    let open = false
    let active = -1
    let loading = false

    let debounce: ReturnType<typeof setTimeout> | undefined
    let abort: AbortController | undefined

    function search(q: string) {
      if (q.trim().length < 2) {
        options = []
        active = -1
        handle.update()
        return
      }
      if (debounce) clearTimeout(debounce)
      debounce = setTimeout(async () => {
        abort?.abort()
        abort = new AbortController()
        loading = true
        handle.update()
        try {
          const res = await fetch(`/api/stations?q=${encodeURIComponent(q)}`, {
            signal: abort.signal,
          })
          if (!res.ok) return
          const data = (await res.json()) as StationOption[]
          if (abort.signal.aborted) return
          options = data
          active = data.length ? 0 : -1
        } catch {
          // ignored — abort or network
        } finally {
          loading = false
          handle.update()
        }
      }, 140)
    }

    function pick(o: StationOption) {
      query = o.name
      selectedId = o.id
      options = []
      open = false
      handle.update()
    }

    return () => (
      <div mix={wrapStyle}>
        <label mix={labelStyle}>
          <span>{handle.props.label}</span>
          <input
            type="text"
            autoComplete="off"
            spellCheck={false}
            role="combobox"
            aria-expanded={open}
            placeholder={handle.props.placeholder}
            value={query}
            mix={[
              inputStyle,
              on('focus', () => {
                open = true
                handle.update()
              }),
              on('blur', () => {
                // Delay so click on a list item registers first.
                setTimeout(() => {
                  if (!open) return
                  open = false
                  handle.update()
                }, 120)
              }),
              on('input', (e) => {
                const v = (e.currentTarget as HTMLInputElement).value
                query = v
                selectedId = ''
                open = true
                handle.update()
                search(v)
              }),
              on('keydown', (e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  active = Math.min(active + 1, options.length - 1)
                  handle.update()
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  active = Math.max(active - 1, 0)
                  handle.update()
                } else if (e.key === 'Enter') {
                  if (active >= 0 && options[active]) {
                    e.preventDefault()
                    pick(options[active])
                  }
                } else if (e.key === 'Escape') {
                  open = false
                  handle.update()
                }
              }),
            ]}
          />
        </label>
        <input type="hidden" name={handle.props.name} value={selectedId} />
        {open && (options.length > 0 || loading) ? (
          <ul role="listbox" mix={listStyle}>
            {loading && options.length === 0 ? (
              <li mix={loadingStyle}>Searching…</li>
            ) : null}
            {options.map((o, i) => (
              <li
                key={o.id}
                role="option"
                aria-selected={i === active}
                mix={[
                  optionStyle,
                  on('pointerdown', (ev) => {
                    ev.preventDefault()
                    pick(o)
                  }),
                ]}
                style={{
                  background:
                    i === active ? 'var(--accent-soft)' : 'transparent',
                }}
              >
                {o.name}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    )
  },
)

const wrapStyle = css({
  position: 'relative',
  display: 'block',
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
  textTransform: 'none',
  letterSpacing: 'normal',
  '&:focus': { outline: '2px solid var(--accent)', outlineOffset: '2px' },
})

const listStyle = css({
  position: 'absolute',
  zIndex: 20,
  top: 'calc(100% + 4px)',
  left: 0,
  right: 0,
  margin: 0,
  padding: '4px',
  listStyle: 'none',
  maxHeight: '280px',
  overflowY: 'auto',
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  boxShadow: '0 10px 30px -12px rgba(0,0,0,0.18)',
})

const optionStyle = css({
  padding: '8px 10px',
  borderRadius: '6px',
  fontSize: '14px',
  color: 'var(--fg)',
  cursor: 'pointer',
  textTransform: 'none',
  letterSpacing: 'normal',
})

const loadingStyle = css({
  padding: '8px 10px',
  fontSize: '13px',
  color: 'var(--muted)',
})
