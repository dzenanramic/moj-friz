import type { ReactNode } from 'react'

import type { AppointmentStatus, StaffColor } from '@/data/types'
import { cn } from '@/lib/cn'

/**
 * Status names as a noun (a pill, a heading): "Otkazano", "Potvrđeno". In a sentence about the
 * appointment itself, write "Termin je otkazan" instead of bending these.
 */
export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  confirmed: 'Potvrđeno',
  completed: 'Završeno',
  cancelled: 'Otkazano',
  no_show: 'Nedolazak',
}

/*
 * A finished appointment is closed, not in play: neutral. Only a no-show and a
 * cancellation carry the alarm colour.
 */
const statusDotColors: Record<AppointmentStatus, string> = {
  confirmed: 'bg-primary',
  completed: 'bg-muted',
  cancelled: 'bg-danger',
  no_show: 'bg-accent-ui',
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
        status === 'no_show'
          ? 'text-accent-ui'
          : status === 'cancelled'
            ? 'text-danger'
            : 'text-muted',
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
  className,
}: {
  active: boolean
  labelOn?: string
  labelOff?: string
  className?: string
}) {
  return (
    <span
      className={cn('inline-flex items-center gap-2 text-xs font-medium text-muted', className)}
    >
      <span
        aria-hidden="true"
        className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-primary' : 'bg-muted')}
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

const statusPill: Record<AppointmentStatus, { className: string; dot: string }> = {
  confirmed: {
    className: 'border-primary bg-primary-tint text-primary',
    dot: 'bg-primary',
  },
  completed: {
    className: 'border-line bg-surface text-muted',
    dot: 'bg-muted',
  },
  cancelled: {
    className: 'border-danger bg-brick-tint text-danger',
    dot: 'bg-danger',
  },
  no_show: {
    className: 'border-accent-ui bg-accent-tint text-accent-ui',
    dot: 'bg-accent-ui',
  },
}

/**
 * The same status as a pill, for places that need the state to hold a row (a confirmation,
 * a detail sheet): tinted fill, a border in the status colour, and the word in that colour.
 * The border matters in dark mode, where tints cannot carry the shape on their own.
 */
export function StatusPill({
  status,
  className,
}: {
  status: AppointmentStatus
  className?: string
}) {
  const pill = statusPill[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap',
        pill.className,
        className,
      )}
    >
      <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', pill.dot)} />
      {STATUS_LABELS[status]}
    </span>
  )
}

/** A break or an absence: not an appointment, so it reads muted on a neutral fill. */
export function PausedPill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-line px-2.5 py-1 text-xs font-medium whitespace-nowrap text-muted',
        className,
      )}
    >
      {children}
    </span>
  )
}
