import type { ReactNode } from 'react'

import type { AppointmentStatus, PlanLevel, StaffColor } from '@/data/types'
import { cn } from '@/lib/cn'

type BadgeTone = 'neutral' | 'pine' | 'amber' | 'danger' | 'outline'

const badgeTones: Record<BadgeTone, string> = {
  neutral: 'bg-paper text-muted',
  pine: 'bg-pine-soft text-pine',
  amber: 'bg-amber-soft text-amber-ink',
  danger: 'bg-danger-soft text-danger',
  outline: 'border border-line-strong bg-transparent text-muted',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs leading-none font-medium whitespace-nowrap',
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  confirmed: 'Potvrđen',
  completed: 'Završen',
  cancelled: 'Otkazan',
  no_show: 'Nedolazak',
}

const statusTones: Record<AppointmentStatus, BadgeTone> = {
  confirmed: 'pine',
  completed: 'neutral',
  cancelled: 'outline',
  no_show: 'amber',
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <Badge tone={statusTones[status]}>
      <span
        aria-hidden="true"
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          status === 'confirmed' && 'bg-pine',
          status === 'completed' && 'bg-muted',
          status === 'cancelled' && 'bg-line-strong',
          status === 'no_show' && 'bg-amber',
        )}
      />
      {STATUS_LABELS[status]}
    </Badge>
  )
}

export function LevelBadge({ level }: { level: PlanLevel }) {
  return <Badge tone="outline">{level === 'level_1' ? 'Paket 1' : 'Paket 2'}</Badge>
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
