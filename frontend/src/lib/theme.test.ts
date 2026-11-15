import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  readStoredChoice,
  resolveTheme,
  setStoredChoice,
  startTheme,
  systemPrefersDark,
  THEME_STORAGE_KEY,
  toggleTheme,
} from './theme'

/**
 * Point matchMedia at the same query the app uses. `state.dark` can be flipped after the fact;
 * a flip is announced to every listener, as a browser would.
 */
function systemPrefers(dark: boolean) {
  const listeners = new Set<() => void>()
  const state = { dark }
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      get matches() {
        return query === '(prefers-color-scheme: dark)' ? state.dark : false
      },
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
      dispatchEvent: vi.fn(),
    })),
  })
  return {
    set(next: boolean) {
      state.dark = next
      ;[...listeners].forEach((listener) => listener())
    },
  }
}

afterEach(() => {
  document.documentElement.className = ''
  vi.restoreAllMocks()
})

describe('theme choice', () => {
  it('starts from the system preference when nothing is stored', () => {
    systemPrefers(true)
    expect(readStoredChoice()).toBe('system')
    expect(resolveTheme('system', systemPrefersDark())).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })

  it('lets an explicit choice win over the system', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('stores the choice under mojfriz.theme and repaints <html>', () => {
    systemPrefers(false)
    setStoredChoice('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('stored-dark')).toBe(true)

    setStoredChoice('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.classList.contains('light')).toBe(true)

    // Back to the system: the key is gone, so the preference block in CSS decides again.
    setStoredChoice('system')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
    expect(document.documentElement.classList.contains('stored-system')).toBe(true)
  })

  it('follows a system change only while the choice is system', () => {
    const system = systemPrefers(false)
    const stop = startTheme()
    expect(document.documentElement.classList.contains('light')).toBe(true)

    system.set(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    // With an explicit choice, a system change stops mattering.
    setStoredChoice('light')
    system.set(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    stop()
  })

  it('ignores an unknown stored value', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'sepia')
    expect(readStoredChoice()).toBe('system')
  })
})

describe('toggleTheme', () => {
  it('flips the mode on the page and remembers it', () => {
    systemPrefers(false)
    setStoredChoice('system')
    toggleTheme('light')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    toggleTheme('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.classList.contains('light')).toBe(true)
  })
})
