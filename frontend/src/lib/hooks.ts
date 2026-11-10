import { useEffect, useState } from 'react'

export function usePageTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} — Studio Lana (demo)`
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
