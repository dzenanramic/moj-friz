import { useEffect, useState } from 'react'

/**
 * The name of the product, not of the salon inside it. A subscriber's workspace is one salon,
 * but the application itself is Moj friz for everyone: the top bar and the tab title carry this,
 * and the salon's own name lives in its data (public booking, settings, the client's link).
 */
export const APP_NAME = 'Moj friz'

export function usePageTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} — ${APP_NAME} (demo)`
  }, [title])
}

export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(timer)
  }, [intervalMs])

  return now
}

export function useDebouncedValue<T>(value: T, delayMs = 200): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}

export function useCopyToClipboard(): {
  copied: boolean
  copy: (value: string) => Promise<boolean>
} {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2500)
    return () => window.clearTimeout(timer)
  }, [copied])

  const copy = async (value: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      return true
    } catch {
      setCopied(false)
      return false
    }
  }

  return { copied, copy }
}

/**
 * True while the viewport matches `query`, re-read on rotation and resize.
 *
 * For the few places that must decide in JS rather than in CSS — rendering one label instead of
 * two, an inline grid template, a scroll calculation. A component that only shows or hides
 * something should use a `sm:` / `lg:` class instead. Without `matchMedia` this reports false.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia(query).matches,
  )

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const list = window.matchMedia(query)
    const onChange = () => setMatches(list.matches)
    onChange()
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [query])

  return matches
}
