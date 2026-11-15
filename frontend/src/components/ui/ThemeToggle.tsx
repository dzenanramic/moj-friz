import { Moon, Sun } from 'lucide-react'

import { cn } from '@/lib/cn'
import { toggleTheme, useTheme } from '@/lib/theme'

/**
 * The theme switch. One button, one mode: the moon while the page is light, the sun while it is
 * dark. It is a toggle button, so `aria-pressed` says which way it is set, and the label says
 * what pressing it will do. The choice is stored (mojfriz.theme) and then wins over the system
 * preference, including on the next visit.
 *
 * It lives on the Postavke page (`variant="setting"`), and the demo bar shows the same button so
 * the mode can be tried from any screen, on a phone and on the public booking page.
 */
export function ThemeToggle({
  variant = 'bar',
  className,
}: {
  /** `bar` sits on the blue demo bar; `setting` sits on the paper of a settings page. */
  variant?: 'bar' | 'setting'
  className?: string
}) {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const label = dark ? 'Uključi svjetlu temu' : 'Uključi tamnu temu'

  return (
    <button
      type="button"
      aria-pressed={dark}
      aria-label={label}
      title={label}
      onClick={() => toggleTheme(theme)}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-sm transition-colors',
        variant === 'bar'
          ? 'h-8 w-8 text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-primary'
          : 'h-11 w-11 bg-surface text-ink ring-1 ring-inset ring-line hover:bg-paper',
        className,
      )}
    >
      {dark ? (
        <Sun aria-hidden="true" className="h-4 w-4" />
      ) : (
        <Moon aria-hidden="true" className="h-4 w-4" />
      )}
    </button>
  )
}
