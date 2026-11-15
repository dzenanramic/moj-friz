import { Coffee, Eye, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'

import {
  HorizontalDateStrip,
  type DateStripItem,
} from '@/components/date-strip/HorizontalDateStrip'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, PageHeader, Panel, Skeleton } from '@/components/ui/Layout'
import { useAppointments, useHairdressers, useTimeBlocks, useWorkingHours } from '@/data/queries'
import type { AppointmentView, Hairdresser, TimeBlock } from '@/data/types'
import { cn } from '@/lib/cn'
import { useNow, usePageTitle } from '@/lib/hooks'
import { useSwipe, type SwipeDirection } from '@/lib/swipe'
import {
  addDaysToDateKey,
  capitalizeFirst,
  dayRange,
  formatDateCompact,
  formatDateLong,
  formatTime,
  formatWeekday,
  isValidDateKey,
  stableDateStripWindow,
  todayDateKey,
  weekdayIndexFromDateKey,
} from '@/lib/time'

import { AppointmentDialog } from '../appointments/AppointmentDialog'
import { AppointmentListItem } from '../appointments/AppointmentListItem'
import { CalendarGrid } from './CalendarGrid'
import { HairdresserFilter } from './HairdresserFilter'

interface DialogState {
  mode: 'create' | 'edit'
  appointment?: AppointmentView
  defaults?: { dateKey?: string; time?: string; hairdresserId?: string }
}

export function CalendarPage() {
  usePageTitle('Kalendar')
  const now = useNow()
  const today = todayDateKey(now)
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedDate = searchParams.get('datum')
  const dateKey = requestedDate && isValidDateKey(requestedDate) ? requestedDate : today
  const requestedHairdresser = searchParams.get('frizer')

  const hairdressersQuery = useHairdressers()
  const workingHours = useWorkingHours()
  const range = useMemo(() => dayRange(dateKey), [dateKey])
  const appointments = useAppointments(range)
  const blocks = useTimeBlocks(range)

  const activeHairdressers = useMemo(
    () => (hairdressersQuery.data ?? []).filter((hairdresser) => hairdresser.isActive),
    [hairdressersQuery.data],
  )
  const filter =
    requestedHairdresser && activeHairdressers.some((item) => item.id === requestedHairdresser)
      ? requestedHairdresser
      : 'all'
  const visibleHairdressers =
    filter === 'all' ? activeHairdressers : activeHairdressers.filter((item) => item.id === filter)

  const weekday = weekdayIndexFromDateKey(dateKey)
  const visibleWorkingHours = (workingHours.data ?? []).filter(
    (interval) =>
      interval.weekday === weekday &&
      visibleHairdressers.some((hairdresser) => hairdresser.id === interval.hairdresserId),
  )
  const isClosed = workingHours.isSuccess && visibleWorkingHours.length === 0

  const dayAppointments = useMemo(
    () =>
      (appointments.data ?? []).filter(
        (appointment) =>
          appointment.status !== 'cancelled' &&
          (filter === 'all' || appointment.hairdresserId === filter),
      ),
    [appointments.data, filter],
  )
  const dayBlocks = useMemo(
    () => (blocks.data ?? []).filter((block) => filter === 'all' || block.hairdresserId === filter),
    [blocks.data, filter],
  )
  const breakCount = dayBlocks.length

  const [dialog, setDialog] = useState<DialogState | null>(null)
  /** Breaks are context, not work: a quiet line by default, one toggle to see them in full. */
  const [showBreaks, setShowBreaks] = useState(false)

  const agenda = useMemo(
    () => buildAgenda(dayAppointments, dayBlocks),
    [dayAppointments, dayBlocks],
  )
  /** The agenda keeps the work in front: breaks join only when the owner asks for them. */
  const visibleAgenda = useMemo(
    () => (showBreaks ? agenda : agenda.filter((entry) => entry.kind === 'appointment')),
    [agenda, showBreaks],
  )

  const updateParams = (nextDateKey: string, nextFilter: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('datum', nextDateKey)
    if (nextFilter === 'all') next.delete('frizer')
    else next.set('frizer', nextFilter)
    setSearchParams(next, { replace: true })
  }

  const openCreate = (defaults?: DialogState['defaults']) => {
    setDialog({
      mode: 'create',
      defaults: {
        dateKey,
        hairdresserId: filter === 'all' ? undefined : filter,
        ...defaults,
      },
    })
  }

  const openAppointment = (appointment: AppointmentView) => setDialog({ mode: 'edit', appointment })

  const [swipeNudge, setSwipeNudge] = useState<SwipeDirection | null>(null)

  /** One day back on a right swipe, one day on on a left swipe. */
  const shiftDay = (direction: SwipeDirection) => {
    updateParams(addDaysToDateKey(dateKey, direction === 'left' ? 1 : -1), filter)
    // A short nudge in the swipe's direction, so the gesture visibly did something.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    setSwipeNudge(direction)
    window.setTimeout(() => setSwipeNudge(null), 220)
  }
  const swipe = useSwipe(shiftDay)

  /** Three weeks from today, with the selected day in it: the strip does not follow each tap. */
  const days = useMemo(() => stableDateStripWindow(today, dateKey), [today, dateKey])
  const dayLabel = capitalizeFirst(formatDateLong(dateKey))
  const dayStripItems: DateStripItem[] = days.map((day) => ({
    dateKey: day,
    label: formatDateLong(day),
    weekday: formatWeekday(day, true),
    day: formatDateCompact(day).slice(0, 5),
    dot: day === today ? 'today' : false,
  }))
  const pending =
    appointments.isPending ||
    blocks.isPending ||
    workingHours.isPending ||
    hairdressersQuery.isPending

  return (
    <div>
      <PageHeader title="Kalendar" align="start" className="pb-4 sm:pb-5" />

      <div className="mb-5">
        {/* Days first: the date row is the spine of the page. */}
        {/* A strip of days, not a fixed grid: swipe or scroll for later days. */}
        <HorizontalDateStrip
          label="Izaberite dan"
          items={dayStripItems}
          value={dateKey}
          showArrows={false}
          onChange={(next) => updateParams(next, filter)}
        />

        {/* One toolbar under the days: whose schedule, whether breaks show, and the action. */}
        <div className="mt-3 flex items-center gap-1.5 border-t border-line pt-3">
          <HairdresserFilter
            hairdressers={activeHairdressers}
            value={filter}
            onChange={(next) => updateParams(dateKey, next)}
          />
          {breakCount > 0 && !pending ? (
            <button
              type="button"
              aria-pressed={showBreaks}
              onClick={() => setShowBreaks((current) => !current)}
              className={cn(
                'inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors',
                showBreaks
                  ? 'bg-primary-tint font-medium text-primary-hover'
                  : 'text-muted hover:bg-surface hover:text-ink',
              )}
            >
              <Coffee aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">
                {breakCount} {breakCount === 1 ? 'pauza' : 'pauze'}
              </span>
              <Eye
                aria-hidden="true"
                className={cn('h-3.5 w-3.5 shrink-0', showBreaks ? 'opacity-100' : 'opacity-50')}
              />
            </button>
          ) : null}
          <Button
            size="sm"
            className="ml-auto"
            aria-label="Novi termin"
            leftIcon={<Plus aria-hidden="true" className="h-4 w-4" />}
            onClick={() => openCreate()}
          >
            <span className="hidden sm:inline">Novi termin</span>
            <span className="sm:hidden">Novi</span>
          </Button>
        </div>
      </div>

      {pending ? (
        <Skeleton className="h-[420px] w-full rounded-lg" />
      ) : appointments.isError || blocks.isError || workingHours.isError ? (
        <ErrorState
          title="Raspored se nije učitao"
          message="Osvježite prikaz ili pokušajte ponovo."
          onRetry={() => {
            void appointments.refetch()
            void blocks.refetch()
            void workingHours.refetch()
            void hairdressersQuery.refetch()
          }}
        />
      ) : isClosed ? (
        <EmptyState
          icon={Coffee}
          title="Nema radnog vremena"
          description={`${dayLabel} izabrani frizeri ne rade. Izaberite drugi dan u sedmici iznad.`}
          action={
            <Button
              variant="secondary"
              onClick={() => updateParams(addDaysToDateKey(dateKey, 1), filter)}
            >
              Sljedeći dan
            </Button>
          }
        />
      ) : (
        <>
          <div className="hidden lg:block">
            <CalendarGrid
              dateKey={dateKey}
              now={now}
              hairdressers={visibleHairdressers}
              workingHours={workingHours.data ?? []}
              appointments={dayAppointments}
              blocks={dayBlocks}
              onOpenAppointment={openAppointment}
              onCreateAt={(hairdresserId, time) => openCreate({ hairdresserId, time })}
            />
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Klik na slobodno vrijeme otvara novi termin. Promjena termina je uvijek kroz formu,
              bez prevlačenja.
            </p>
          </div>

          {/* The agenda takes the same swipe: a thumb resting on the list moves the day too. */}
          <div
            {...swipe}
            className={cn(
              'touch-pan-y lg:hidden',
              swipeNudge === 'left' && 'animate-[swipe-left_220ms_cubic-bezier(.2,.8,.2,1)]',
              swipeNudge === 'right' && 'animate-[swipe-right_220ms_cubic-bezier(.2,.8,.2,1)]',
            )}
          >
            {visibleAgenda.length > 0 ? (
              <Panel className="py-1">
                {visibleAgenda.map((entry) =>
                  entry.kind === 'appointment' ? (
                    <AppointmentListItem
                      key={entry.id}
                      appointment={entry.appointment}
                      onOpen={openAppointment}
                    />
                  ) : (
                    <BreakRow
                      key={entry.id}
                      block={entry.block}
                      member={activeHairdressers.find(
                        (hairdresser) => hairdresser.id === entry.block.hairdresserId,
                      )}
                    />
                  ),
                )}
              </Panel>
            ) : (
              <EmptyState
                icon={Coffee}
                title="Nema termina za ovaj dan"
                description="Slobodno vrijeme je dostupno za novi termin ili pauzu."
                action={
                  <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => openCreate()}>
                    Novi termin
                  </Button>
                }
              />
            )}
          </div>
        </>
      )}

      {dialog ? (
        <AppointmentDialog
          mode={dialog.mode}
          appointment={dialog.appointment}
          defaults={dialog.defaults}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </div>
  )
}

/**
 * A break is context, not work: one quiet line instead of a row that competes with the
 * real appointments above it.
 */
function BreakRow({ block, member }: { block: TimeBlock; member?: Hairdresser }) {
  return (
    <div className="flex items-center gap-3 border-b border-line px-3 py-2 last:border-b-0">
      <span className="tabular w-[86px] shrink-0 text-[0.7rem] text-muted">
        {formatTime(block.startsAt)}–{formatTime(block.endsAt)}
      </span>
      <Coffee aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-muted" />
      <p className="min-w-0 flex-1 truncate text-xs text-muted">
        {block.reason}
        {member ? <span className="text-muted"> · {member.displayName}</span> : null}
      </p>
    </div>
  )
}

type AgendaEntry =
  | { kind: 'appointment'; id: string; appointment: AppointmentView }
  | { kind: 'block'; id: string; block: TimeBlock }

function buildAgenda(appointments: AppointmentView[], blocks: TimeBlock[]): AgendaEntry[] {
  const entries: AgendaEntry[] = [
    ...appointments.map((appointment) => ({
      kind: 'appointment' as const,
      id: appointment.id,
      appointment,
    })),
    ...blocks.map((block) => ({ kind: 'block' as const, id: block.id, block })),
  ]
  return entries.sort((left, right) => {
    const leftStart = left.kind === 'appointment' ? left.appointment.startsAt : left.block.startsAt
    const rightStart =
      right.kind === 'appointment' ? right.appointment.startsAt : right.block.startsAt
    return new Date(leftStart).getTime() - new Date(rightStart).getTime()
  })
}
