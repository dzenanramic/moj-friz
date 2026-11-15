import { Coffee, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'

import {
  HorizontalDateStrip,
  type DateStripItem,
} from '@/components/date-strip/HorizontalDateStrip'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, PageHeader, Panel, Skeleton } from '@/components/ui/Layout'
import { useAppointments, useHairdressers, useWorkingHours } from '@/data/queries'
import type { AppointmentView } from '@/data/types'
import { cn } from '@/lib/cn'
import { useNow, usePageTitle } from '@/lib/hooks'
import { useSwipe, type SwipeDirection } from '@/lib/swipe'
import {
  addDaysToDateKey,
  capitalizeFirst,
  dayRange,
  formatDateCompact,
  formatDateLong,
  formatWeekday,
  isValidDateKey,
  stableDateStripWindow,
  todayDateKey,
  weekdayIndexFromDateKey,
} from '@/lib/time'

import { AppointmentDialog } from '../appointments/AppointmentDialog'
import { AppointmentListItem } from '../appointments/AppointmentListItem'
import { CalendarGrid } from './CalendarGrid'
import { CalendarViewSwitch } from './CalendarViewSwitch'
import { HairdresserFilter } from './HairdresserFilter'
import { useCalendarView } from './useCalendarView'

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
  const [dialog, setDialog] = useState<DialogState | null>(null)

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

  /*
   * Agenda or hour grid. The grid used to be a desktop-only layout; now it is a choice that
   * exists on a phone too (the agenda is still the default), and the switch sits beside the
   * hairdresser filter so the two filters of the page are one row.
   */
  const { view, choose: chooseView } = useCalendarView()
  const showGrid = view === 'grid'

  const [swipeNudge, setSwipeNudge] = useState<SwipeDirection | null>(null)

  /** One day back on a right swipe, one day on on a left swipe. */
  const shiftDay = (direction: SwipeDirection) => {
    updateParams(addDaysToDateKey(dateKey, direction === 'left' ? 1 : -1), filter)
    // A short nudge in the swipe's direction, so the gesture visibly did something.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    setSwipeNudge(direction)
    window.setTimeout(() => setSwipeNudge(null), 220)
  }
  /*
   * On the grid, a sideways finger scrolls the hairdresser columns, so it must not also change
   * the day: two things moving at once. The agenda keeps the swipe.
   */
  const swipe = useSwipe(shiftDay, { enabled: !showGrid })

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
  const pending = appointments.isPending || workingHours.isPending || hairdressersQuery.isPending

  return (
    <div>
      {/*
       * The view switch is a property of the day, not of the schedule under it, so it belongs with
       * the title. On a phone the header stays one block — title, switch under the title, and a
       * row that begins with a gap — so the switch sits in a column of its own beside the title
       * instead of wrapping under it.
       */}
      <PageHeader
        title="Kalendar"
        actionsWrap="beside"
        className="pb-4 sm:pb-5"
        actions={<CalendarViewSwitch value={view} onChange={chooseView} />}
      />

      <div className="mb-5">
        {/* Days first: the date row is the spine of the page. */}
        {/* A strip of days, not a fixed grid: swipe or scroll for later days. */}
        <HorizontalDateStrip
          label="Izaberite dan"
          items={dayStripItems}
          value={dateKey}
          onChange={(next) => updateParams(next, filter)}
        />

        {/* One toolbar under the days: whose schedule, and the action. */}
        <div className="mt-3 flex items-center gap-1.5 border-t border-line pt-3">
          <HairdresserFilter
            hairdressers={activeHairdressers}
            value={filter}
            onChange={(next) => updateParams(dateKey, next)}
            className="min-w-0"
          />
          <Button
            size="md"
            /* A phone gets the round + : the words cost the width the filter needs, and the
               button's accessible name is still "Novi termin". */
            className="ml-auto max-sm:w-11 max-sm:rounded-full max-sm:px-0"
            aria-label="Novi termin"
            leftIcon={<Plus aria-hidden="true" className="h-4 w-4" />}
            onClick={() => openCreate()}
          >
            <span className="hidden sm:inline">Novi termin</span>
          </Button>
        </div>
      </div>

      {pending ? (
        <Skeleton className="h-[420px] w-full rounded-lg" />
      ) : appointments.isError || workingHours.isError ? (
        <ErrorState
          title="Raspored se nije učitao"
          message="Osvježite prikaz ili pokušajte ponovo."
          onRetry={() => {
            void appointments.refetch()
            void workingHours.refetch()
            void hairdressersQuery.refetch()
          }}
        />
      ) : isClosed ? (
        <EmptyState
          as="h2"
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
          <div className={cn(!showGrid && 'hidden lg:block')}>
            <CalendarGrid
              dateKey={dateKey}
              now={now}
              hairdressers={visibleHairdressers}
              workingHours={workingHours.data ?? []}
              appointments={dayAppointments}
              onOpenAppointment={openAppointment}
              onCreateAt={(hairdresserId, time) => openCreate({ hairdresserId, time })}
            />
            <p className="mt-3 text-xs leading-relaxed text-muted">
              <span className="hidden sm:inline">
                Klik na slobodno vrijeme otvara novi termin. Promjena termina je uvijek kroz formu,
                bez prevlačenja.
              </span>
              <span className="sm:hidden">Klik na slobodno vrijeme otvara novi termin.</span>
            </p>
          </div>

          <div
            {...swipe}
            className={cn(
              'touch-pan-y lg:hidden',
              showGrid && 'hidden',
              swipeNudge === 'left' && 'animate-[swipe-left_220ms_cubic-bezier(.2,.8,.2,1)]',
              swipeNudge === 'right' && 'animate-[swipe-right_220ms_cubic-bezier(.2,.8,.2,1)]',
            )}
          >
            {dayAppointments.length > 0 ? (
              <Panel className="py-1">
                {dayAppointments.map((appointment) => (
                  <AppointmentListItem
                    key={appointment.id}
                    appointment={appointment}
                    onOpen={openAppointment}
                  />
                ))}
              </Panel>
            ) : (
              <EmptyState
                as="h2"
                icon={Coffee}
                title="Nema termina za ovaj dan"
                description="Slobodno vrijeme je dostupno za novi termin."
                action={
                  <Button
                    variant="secondary"
                    leftIcon={<Plus className="h-4 w-4" />}
                    onClick={() => openCreate()}
                  >
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
