import type { AppointmentStatus, StaffColor } from '@/data/types'
import { cn } from '@/lib/cn'

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  confirmed: 'Potvrđen',
  completed: 'Završen',
  cancelled: 'Otkazan',
  no_show: 'Nedolazak',
}

const statusDotColors: Record<AppointmentStatus, string> = {
  confirmed: 'bg-pine',
  completed: 'bg-line-strong',
  cancelled: 'bg-line-strong',
  no_show: 'bg-amber',
}

/**
 * Status is a coloured dot plus plain text. No pill, no tinted background:
 * the dot carries the state, the word carries the meaning.
 */
export function StatusIndicator({
  status,
  className,
}: {
  status: AppointmentStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-xs font-medium whitespace-nowrap',
        status === 'no_show' ? 'text-amber-ink' : 'text-muted',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('h-1.5 w-1.5 rounded-full', statusDotColors[status])}
      />
      {STATUS_LABELS[status]}
    </span>
  )
}

/** Active or inactive, stated as a dot and a word rather than a filled chip. */
export function ActiveState({
  active,
  labelOn = 'Aktivno',
  labelOff = 'Neaktivno',
}: {
  active: boolean
  labelOn?: string
  labelOff?: string
}) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-muted">
      <span
        aria-hidden="true"
        className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-pine' : 'bg-line-strong')}
      />
      {active ? labelOn : labelOff}
    </span>
  )
}

export function StaffName({
  name,
  colorKey,
  className,
}: {
  name: string
  colorKey: StaffColor
  className?: string
}) {
  return (
    <span
      data-staff={colorKey}
      className={cn('inline-flex items-center gap-1.5 text-xs font-medium text-muted', className)}
    >
      <span aria-hidden="true" className="staff-bar h-1.5 w-1.5 rounded-full" />
      {name}
    </span>
  )
}
