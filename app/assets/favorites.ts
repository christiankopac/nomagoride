export interface Favorite {
  from: { id: string; name: string }
  to: { id: string; name: string }
  savedAt: number
}

const KEY = 'nomagoride.favorites.v1'
const EVENT = 'nomagoride:favorites'

function read(): Favorite[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (f) =>
        f &&
        typeof f === 'object' &&
        f.from?.id &&
        f.from?.name &&
        f.to?.id &&
        f.to?.name &&
        typeof f.savedAt === 'number',
    ) as Favorite[]
  } catch {
    return []
  }
}

function write(list: Favorite[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(list))
  window.dispatchEvent(new Event(EVENT))
}

export function getAll(): Favorite[] {
  return read().sort((a, b) => b.savedAt - a.savedAt)
}

export function isSaved(fromId: string, toId: string): boolean {
  return read().some((f) => f.from.id === fromId && f.to.id === toId)
}

export function add(fav: Omit<Favorite, 'savedAt'>): void {
  const list = read()
  if (list.some((f) => f.from.id === fav.from.id && f.to.id === fav.to.id)) return
  list.push({ ...fav, savedAt: Date.now() })
  write(list)
}

export function remove(fromId: string, toId: string): void {
  const list = read().filter(
    (f) => !(f.from.id === fromId && f.to.id === toId),
  )
  write(list)
}

export function subscribe(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const onChange = () => handler()
  window.addEventListener(EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}
