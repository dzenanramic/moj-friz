import { useSyncExternalStore } from 'react'

/**
 * Which day view the calendar shows: the agenda (one row per appointment, and the only shape a
 * phone could draw before) or the hour grid.
 *
 * The grid used to be desktop-only (`hidden lg:block`) because nobody had checked whether its
 * columns read on a phone. They do: two or three hairdressers fit without scrolling, and tapping
 * free space is what makes the grid worth having. So on small screens the grid is a choice, not a
 * screen size. The choice is remembered in `mojfriz.calendarView`, the way the theme is; a phone
 * that has never chosen anything still opens on the agenda, which is the calmer list.
 *
 * No first-paint script: the agenda and the grid are both on the page from the first paint (CSS
 * hides one of them), so a stored `grid` swaps in without moving the layout.
 */
export type CalendarView = 'agenda' | 'grid'

export const CALENDAR_VIEW_STORAGE_KEY = 'mojfriz.calendarView'

function storage(): Storage | null {
  try {
    return window.localStorage ?? null
  } catch {
    return null
  }
}

export function readStoredView(): CalendarView | null {
  const value = storage()?.getItem(CALENDAR_VIEW_STORAGE_KEY)
  return value === 'agenda' || value === 'grid' ? value : null
}

export function storeView(view: CalendarView): void {
  try {
    storage()?.setItem(CALENDAR_VIEW_STORAGE_KEY, view)
  } catch {
    // A full or blocked storage only costs the choice on the next visit.
  }
}

const listeners = new Set<() => void>()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function emit(): void {
  for (const listener of listeners) listener()
}

export function setStoredView(view: CalendarView): void {
  storeView(view)
  emit()
}

/** Another tab's choice is picked up through `storage`. Call once, next to the theme store. */
export function startCalendarView(): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === CALENDAR_VIEW_STORAGE_KEY) emit()
  }
  window.addEventListener('storage', onStorage)
  return () => window.removeEventListener('storage', onStorage)
}

/** The screen is wide enough for the grid to be the page's own shape, not a choice. */
export const WIDE_QUERY = '(min-width: 64rem)'

function isWide(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(WIDE_QUERY).matches
    : false
}

/**
 * The view the calendar is showing, and whether that came from the screen or from a choice.
 *
 * `view` is what to draw: the stored choice, or the agenda when nothing was ever picked.
 * `choose` only does something on a narrow screen — the desktop layout keeps the grid whatever
 * the switch says, so a tap there must not hide it.
 */
export function useCalendarView(): {
  view: CalendarView
  choose: (next: CalendarView) => void
} {
  // The server snapshot is `null`, so a server render and the first client render agree.
  const storedView = useSyncExternalStore(subscribe, readStoredView, () => null)

  const choose = (next: CalendarView) => {
    if (isWide()) return
    setStoredView(next)
  }

  return { view: storedView ?? 'agenda', choose }
}
