import { Check } from 'lucide-react'

import { cn } from '@/lib/cn'

export const BOOKING_STEPS = ['Usluga', 'Frizer', 'Termin', 'Podaci'] as const

/**
 * Answers "where am I, how much is left" for a guest who has never seen this screen.
 *
 * The desktop layout is a numbered track: done steps carry a check and read as links back,
 * so a guest can correct an earlier choice without hunting for a back button. On a phone the
 * track would crowd, so the same information becomes a count, the step name and a bar.
 */
export function StepTracker({ step, onGoTo }: { step: number; onGoTo: (step: number) => void }) {
  const current = step + 1
  const progress = current / BOOKING_STEPS.length

  return (
    <nav aria-label="Koraci rezervacije">
      <p className="tabular flex items-baseline gap-2 text-sm sm:hidden">
        <span className="text-muted">
          Korak {current} od {BOOKING_STEPS.length}
        </span>
        <span className="font-medium text-ink">{BOOKING_STEPS[step]}</span>
      </p>
      <span
        aria-hidden="true"
        className="mt-2 flex h-1 overflow-hidden rounded-full bg-line sm:hidden"
      >
        <span
          className="block rounded-full bg-primary transition-[width] duration-300 ease-[cubic-bezier(.2,.8,.2,1)]"
          style={{ width: `${progress * 100}%` }}
        />
      </span>

      <ol className="relative hidden grid-cols-4 gap-3 sm:grid">
        <span
          aria-hidden="true"
          className="absolute top-4 right-0 left-0 -mx-0 h-px bg-line"
          style={{ left: 'calc(100% / 8)', right: 'calc(100% / 8)' }}
        />
        {BOOKING_STEPS.map((label, index) => {
          const done = index < step
          const active = index === step
          return (
            <li key={label} className="relative">
              <button
                type="button"
                disabled={!done}
                aria-current={active ? 'step' : undefined}
                onClick={() => onGoTo(index)}
                className={cn(
                  'flex w-full items-center gap-2.5 text-left',
                  done ? 'cursor-pointer' : 'cursor-default',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'tabular flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-[background-color,border-color,color,transform] duration-200',
                    active && 'border-primary bg-primary text-on-primary',
                    done && 'border-primary bg-primary-tint text-primary',
                    !active && !done && 'border-line bg-paper text-muted',
                  )}
                >
                  {done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs text-muted">Korak {index + 1}</span>
                  <span
                    className={cn(
                      'block truncate text-sm leading-tight',
                      active
                        ? 'font-semibold text-ink'
                        : done
                          ? 'font-medium text-ink'
                          : 'text-muted',
                    )}
                  >
                    {label}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
