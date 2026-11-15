import { useSyncExternalStore } from 'react'

/**
 * Theme choice.
 *
 * `system` follows the operating system; `light` and `dark` are an explicit choice the owner
 * made. The stored key is `mojfriz.theme`. The first paint is decided by frontend/index.html,
 * which applies the stored choice from CSS and localStorage before any JavaScript runs
 * (the site is served with `script-src 'self'`, so it cannot be an inline script); this module
 * keeps `<html>`, localStorage and the switch in Postavke in step afterwards.
 */
export type ThemeChoice = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'mojfriz.theme'

const MEDIA = '(prefers-color-scheme: dark)'

function systemQuery(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null
  return window.matchMedia(MEDIA)
}

function storage(): Storage | null {
  try {
    return window.localStorage ?? null
  } catch {
    return null
  }
}

export function readStoredChoice(): ThemeChoice {
  const value = storage()?.getItem(THEME_STORAGE_KEY)
  return value === 'light' || value === 'dark' ? value : 'system'
}

export function systemPrefersDark(): boolean {
  return systemQuery()?.matches ?? false
}

/** What the page should look like right now, once the stored choice is taken into account. */
export function resolveTheme(choice: ThemeChoice, prefersDark: boolean): ResolvedTheme {
  if (choice === 'light' || choice === 'dark') return choice
  return prefersDark ? 'dark' : 'light'
}

/**
 * Put the resolved mode on <html>. Three classes matter to the CSS: `.light` / `.dark` (the
 * `:root:not(.light)` preference block and every `dark:` utility), `stored-dark` and
 * `stored-system` (public/theme-boot.css and theme-boot.js, which run before this code).
 */
export function applyTheme(theme: ResolvedTheme): void {
  const root = document.documentElement
  root.classList.remove('stored-light', 'stored-dark', 'stored-system')
  if (readStoredChoice() === 'system') {
    root.classList.add('stored-system')
    root.classList.toggle('dark', theme === 'dark')
    root.classList.toggle('light', theme === 'light')
    return
  }
  root.classList.toggle('dark', theme === 'dark')
  root.classList.toggle('light', theme === 'light')
  root.classList.add(theme === 'dark' ? 'stored-dark' : 'stored-light')
}

export function storeChoice(choice: ThemeChoice): void {
  const store = storage()
  if (choice === 'system') store?.removeItem(THEME_STORAGE_KEY)
  else store?.setItem(THEME_STORAGE_KEY, choice)
}

const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Store the choice, repaint immediately (with the boot classes) and tell every subscriber. */
export function setStoredChoice(choice: ThemeChoice): void {
  storeChoice(choice)
  applyTheme(resolveTheme(choice, systemPrefersDark()))
  emit()
}

/**
 * The one-press switch: whatever is on the page now becomes the other mode, and that choice is
 * stored so it survives reloads (it stops following the system preference at that point). The
 * page decides the switch from the mode it is showing, so this never has to know why it is dark.
 */
export function toggleTheme(current: ResolvedTheme): void {
  setStoredChoice(current === 'dark' ? 'light' : 'dark')
}

/** The stored choice and the mode it resolves to, live. */
export function useTheme(): {
  choice: ThemeChoice
  theme: ResolvedTheme
  setChoice: (choice: ThemeChoice) => void
} {
  const choice = useSyncExternalStore(subscribe, readStoredChoice, () => 'system' as ThemeChoice)
  const prefersDark = useSyncExternalStore(subscribe, systemPrefersDark, () => false)
  return {
    choice,
    theme: resolveTheme(choice, prefersDark),
    setChoice: setStoredChoice,
  }
}

/**
 * Keep the page tied to the stored choice while the owner is using it: a system change repaints
 * when the choice is `system`, and another tab's choice is picked up through `storage`.
 */
export function startTheme(): () => void {
  applyTheme(resolveTheme(readStoredChoice(), systemPrefersDark()))

  const query = systemQuery()
  const onSystemChange = () => {
    if (readStoredChoice() === 'system') {
      applyTheme(resolveTheme('system', systemPrefersDark()))
      emit()
    }
  }
  query?.addEventListener?.('change', onSystemChange)

  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return
    applyTheme(resolveTheme(readStoredChoice(), systemPrefersDark()))
    emit()
  }
  window.addEventListener('storage', onStorage)

  return () => {
    query?.removeEventListener?.('change', onSystemChange)
    window.removeEventListener('storage', onStorage)
  }
}
