import { ChevronRight, Globe } from 'lucide-react'

import { StatusIndicator } from '@/components/ui/Badges'
import type { AppointmentView } from '@/data/types'
import { cn } from '@/lib/cn'
import { formatKM } from '@/lib/format'
import { formatTime } from '@/lib/time'

interface AppointmentListItemProps {
  appointment: AppointmentView
  onOpen?: (appointment: AppointmentView) => void
  showPrice?: boolean
}

export function AppointmentListItem({
  appointment,
  onOpen,
  showPrice = false,
}: AppointmentListItemProps) {
  const muted = appointment.status === 'cancelled'
  const interactive = Boolean(onOpen)
  const Wrapper = interactive ? 'button' : 'div'

  return (
    <Wrapper
      {...(interactive ? { type: 'button' as const, onClick: () => onOpen?.(appointment) } : {})}
      className={cn(
        'group flex w-full items-stretch gap-3 rounded-sm px-2 py-3 text-left transition-colors sm:gap-4 sm:px-3',
        interactive && 'hover:bg-paper',
      )}
    >
      <span className="w-[46px] shrink-0 pt-0.5">
        <span
          className={cn(
            'tabular block text-[0.95rem] font-semibold',
            muted ? 'text-muted' : 'text-ink',
          )}
        >
          {formatTime(appointment.startsAt)}
        </span>
        <span className="tabular mt-0.5 block text-xs text-muted">
          {formatTime(appointment.endsAt)}
        </span>
      </span>

      <span
        data-staff={appointment.hairdresserColorKey}
        aria-hidden="true"
        className="staff-bar w-[3px] shrink-0 rounded-xs"
      />

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <span
            className={cn(
              'truncate text-sm font-semibold sm:text-[0.95rem]',
              muted ? 'text-muted line-through decoration-line' : 'text-ink',
            )}
          >
            {appointment.clientName}
          </span>
          <span className="flex shrink-0 items-center gap-3">
            {appointment.source === 'online' ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted">
                <Globe aria-hidden="true" className="h-3 w-3" />
                Online
              </span>
            ) : null}
            <StatusIndicator status={appointment.status} />
          </span>
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs leading-relaxed text-muted">
          <span>
            {appointment.serviceName} · {appointment.hairdresserName}
            {showPrice && appointment.priceMinorSnapshot !== null
              ? ` · ${formatKM(appointment.priceMinorSnapshot)}`
              : ''}
          </span>
        </span>
      </span>

      {interactive ? (
        <span className="flex w-5 shrink-0 items-center justify-end self-center text-muted transition-colors group-hover:text-primary">
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </span>
      ) : null}
    </Wrapper>
  )
}
