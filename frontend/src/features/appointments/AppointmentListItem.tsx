import { ChevronRight, Globe } from 'lucide-react'

import { StatusBadge } from '@/components/ui/Badges'
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
        'group flex w-full items-stretch gap-3 border-b border-line px-2 py-3 text-left last:border-b-0 sm:gap-4 sm:px-3',
        interactive && 'transition-colors hover:bg-paper/70',
      )}
    >
      <span className="w-[52px] shrink-0 pt-0.5">
        <span className="time-gutter-label block text-[0.95rem] font-semibold text-ink">
          {formatTime(appointment.startsAt)}
        </span>
        <span className="time-gutter-label mt-0.5 block text-[0.7rem] text-muted">
          {formatTime(appointment.endsAt)}
        </span>
      </span>

      <span
        data-staff={appointment.hairdresserColorKey}
        aria-hidden="true"
        className="staff-bar w-[3px] shrink-0 rounded-full"
      />

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <span
            className={cn(
              'truncate text-sm font-semibold text-ink sm:text-[0.95rem]',
              muted && 'text-muted line-through decoration-line-strong',
            )}
          >
            {appointment.clientName}
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            {appointment.source === 'online' ? (
              <span className="inline-flex items-center gap-1 text-[0.68rem] font-medium text-muted">
                <Globe aria-hidden="true" className="h-3 w-3" />
                Online
              </span>
            ) : null}
            <StatusBadge status={appointment.status} />
          </span>
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs leading-relaxed text-muted">
          <span>{appointment.serviceName}</span>
          <span aria-hidden="true">·</span>
          <span>{appointment.hairdresserName}</span>
          {showPrice && appointment.priceMinorSnapshot !== null ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{formatKM(appointment.priceMinorSnapshot)}</span>
            </>
          ) : null}
        </span>
      </span>

      {interactive ? (
        <span className="flex w-5 shrink-0 items-center justify-end self-center text-line-strong transition-colors group-hover:text-pine">
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </span>
      ) : null}
    </Wrapper>
  )
}
