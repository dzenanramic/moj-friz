import { ChevronLeft, ChevronRight, Coffee, Plus } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'

import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, PageHeader, Panel, Skeleton } from '@/components/ui/Layout'
import { useAppointments, useHairdressers, useTimeBlocks, useWorkingHours } from '@/data/queries'
import type { AppointmentView, Hairdresser, TimeBlock } from '@/data/types'
import { cn } from '@/lib/cn'
import { formatTerminCount } from '@/lib/format'
import { useNow, usePageTitle } from '@/lib/hooks'
import {
  addDaysToDateKey,
  capitalizeFirst,
  dayRange,
  formatDateCompact,
  formatDateLong,
  formatTime,
  formatWeekday,
  isValidDateKey,
  todayDateKey,
  weekDateKeys,
  weekdayIndexFromDateKey,
} from '@/lib/time'

import { AppointmentDialog } from '../appointments/AppointmentDialog'
import { AppointmentListItem } from '../appointments/AppointmentListItem'
import { BreakDialog } from './BreakDialog'
import { CalendarGrid } from './CalendarGrid'

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
  const agenda = useMemo(
    () => buildAgenda(dayAppointments, dayBlocks),
    [dayAppointments, dayBlocks],
  )

  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [breakOpen, setBreakOpen] = useState(false)

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

  const week = useMemo(() => weekDateKeys(dateKey), [dateKey])
  const dayLabel = capitalizeFirst(formatDateLong(dateKey))
  const pending =
    appointments.isPending ||
    blocks.isPending ||
    workingHours.isPending ||
    hairdressersQuery.isPending

  return (
    <div>
      <PageHeader
        title="Kalendar"
        description={
          <>
            {dayLabel}
            <span className="text-line-strong" aria-hidden="true">
              {' · '}
            </span>
            {appointments.isPending
              ? 'Učitavanje…'
              : `${formatTerminCount(dayAppointments.length)}, ${visibleHairdressers.length} ${
                  visibleHairdressers.length === 1 ? 'frizer' : 'frizera'
                }`}
          </>
        }
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<Coffee className="h-4 w-4" />}
              onClick={() => setBreakOpen(true)}
            >
              Dodaj pauzu
            </Button>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => openCreate()}>
              Novi termin
            </Button>
          </>
        }
      />

      <div className="mb-7">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Prethodni dan"
              onClick={() => updateParams(addDaysToDateKey(dateKey, -1), filter)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-muted transition-colors hover:bg-surface hover:text-ink"
            >
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Sljedeći dan"
              onClick={() => updateParams(addDaysToDateKey(dateKey, 1), filter)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-muted transition-colors hover:bg-surface hover:text-ink"
            >
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </button>
            <Button
              variant="quiet"
              size="sm"
              onClick={() => updateParams(today, filter)}
              disabled={dateKey === today}
            >
              Danas
            </Button>
          </div>
          <p className="text-xs text-muted">
            {filter === 'all'
              ? 'Svi frizeri'
              : activeHairdressers.find((h) => h.id === filter)?.displayName}
          </p>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 sm:gap-1.5">
          {week.map((day) => {
            const selected = day === dateKey
            const isToday = day === today
            return (
              <button
                key={day}
                type="button"
                onClick={() => updateParams(day, filter)}
                aria-current={selected ? 'date' : undefined}
                className={cn(
                  'flex min-h-[58px] flex-col items-center justify-center rounded-md py-2 transition-colors',
                  selected ? 'bg-pine text-white' : 'text-ink hover:bg-surface',
                )}
              >
                <span className={cn('text-xs', selected ? 'text-white' : 'text-muted')}>
                  {formatWeekday(day, true)}
                </span>
                <span className="tabular mt-0.5 text-sm font-semibold">
                  {formatDateCompact(day).slice(0, 5)}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-1 h-1 w-1 rounded-full',
                    selected ? 'bg-amber' : isToday ? 'bg-pine' : 'bg-transparent',
                  )}
                />
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1">
          <FilterChip active={filter === 'all'} onClick={() => updateParams(dateKey, 'all')}>
            Svi
          </FilterChip>
          {activeHairdressers.map((hairdresser) => (
            <FilterChip
              key={hairdresser.id}
              active={filter === hairdresser.id}
              colorKey={hairdresser.colorKey}
              onClick={() => updateParams(dateKey, hairdresser.id)}
            >
              {hairdresser.displayName}
            </FilterChip>
          ))}
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

          <div className="lg:hidden">
            {agenda.length > 0 ? (
              <Panel className="py-1">
                {agenda.map((entry) =>
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

      {breakOpen ? (
        <BreakDialog
          defaultDateKey={dateKey}
          defaultHairdresserId={filter === 'all' ? undefined : filter}
          onClose={() => setBreakOpen(false)}
        />
      ) : null}
    </div>
  )
}

function FilterChip({
  active,
  children,
  onClick,
  colorKey,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
  colorKey?: Hairdresser['colorKey']
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      data-staff={colorKey}
      className={cn(
        'inline-flex min-h-9 items-center gap-2 rounded-sm px-2.5 text-sm transition-colors',
        active ? 'bg-ink font-medium text-paper' : 'text-muted hover:bg-surface hover:text-ink',
      )}
    >
      {colorKey ? (
        <span
          aria-hidden="true"
          className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-paper' : 'staff-bar')}
        />
      ) : null}
      {children}
    </button>
  )
}

function BreakRow({ block, member }: { block: TimeBlock; member?: Hairdresser }) {
  return (
    <div className="flex items-stretch gap-3 px-2 py-3 sm:gap-4 sm:px-3">
      <span className="w-[46px] shrink-0 pt-0.5">
        <span className="tabular block text-[0.95rem] font-semibold text-muted">
          {formatTime(block.startsAt)}
        </span>
        <span className="tabular mt-0.5 block text-xs text-muted">{formatTime(block.endsAt)}</span>
      </span>
      <span className="w-[3px] shrink-0 rounded-xs bg-line-strong" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted">{block.reason}</p>
        <p className="mt-0.5 text-xs text-muted">{member?.displayName ?? 'Frizer'}</p>
      </div>
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
