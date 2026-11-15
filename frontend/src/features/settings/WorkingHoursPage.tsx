import { CalendarPlus, Trash2 } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { StaffName } from '@/components/ui/Badges'
import { Button } from '@/components/ui/Button'
import { ErrorState, Panel, Skeleton } from '@/components/ui/Layout'
import { gatewayErrorMessage } from '@/data/gateway'
import { useDeleteTimeBlock, useHairdressers, useTimeBlocks, useWorkingHours } from '@/data/queries'
import type { TimeBlock, WorkingHoursInterval } from '@/data/types'
import {
  addDaysToDateKey,
  capitalizeFirst,
  dateKeyFromInstant,
  formatDateLong,
  formatTimeRange,
  isoWeekdayLabel,
  startOfSalonDay,
  todayDateKey,
} from '@/lib/time'

import { BreakDialog } from '../calendar/BreakDialog'

export function WorkingHoursPage() {
  const hairdressers = useHairdressers()
  const workingHours = useWorkingHours()
  const today = todayDateKey()
  const range = useMemo(
    () => ({
      from: startOfSalonDay(today),
      to: startOfSalonDay(addDaysToDateKey(today, 14)),
    }),
    [today],
  )
  const blocks = useTimeBlocks(range)
  const deleteBlock = useDeleteTimeBlock()
  const [breakOpen, setBreakOpen] = useState(false)

  if (hairdressers.isError || workingHours.isError || blocks.isError) {
    return (
      <ErrorState
        title="Radno vrijeme se nije učitalo"
        onRetry={() => {
          void hairdressers.refetch()
          void workingHours.refetch()
          void blocks.refetch()
        }}
      />
    )
  }

  if (hairdressers.isPending || workingHours.isPending || blocks.isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    )
  }

  const staff = (hairdressers.data ?? []).filter((member) => member.isActive)
  const hours = workingHours.data ?? []
  const groupedBlocks = groupBlocksByDay(blocks.data ?? [])

  const removeBlock = (block: TimeBlock) => {
    deleteBlock.mutate(block.id, {
      onSuccess: () => toast.success('Pauza je uklonjena iz rasporeda.'),
      onError: (error) => toast.error(gatewayErrorMessage(error)),
    })
  }

  return (
    <div className="space-y-12">
      <section aria-labelledby="weekly-hours">
        <div className="max-w-[62ch]">
          <h2 id="weekly-hours" className="text-xl font-semibold text-ink">
            Sedmično radno vrijeme
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Raspored se ponavlja svake sedmice. Dan bez vremena znači da frizer ne radi.
          </p>
        </div>

        <div className="mt-6">
          <TimeGrid
            columns={staff.map((member) => (
              <div key={member.id}>
                <StaffName name={member.displayName} colorKey={member.colorKey} />
              </div>
            ))}
            rows={Array.from({ length: 7 }).map((_, weekday) => ({
              label: capitalizeFirst(isoWeekdayLabel(weekday)),
              cells: staff.map((member) => (
                <DayHours
                  key={member.id}
                  intervals={hours.filter(
                    (interval) =>
                      interval.hairdresserId === member.id && interval.weekday === weekday,
                  )}
                />
              )),
            }))}
          />
        </div>

        <p className="mt-4 max-w-[70ch] text-xs leading-relaxed text-muted">
          Vremenska zona: Europe/Sarajevo. Uređivanje radnog vremena dolazi uz pilot i tada se
          provjerava da promjena ne ostavlja postojeće termine van radnog vremena.
        </p>
      </section>

      <section aria-labelledby="time-off">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="max-w-[62ch]">
            <h2 id="time-off" className="text-xl font-semibold text-ink">
              Pauze i odsustva
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Naredne dvije sedmice. Pauza ili odsustvo blokiraju vrijeme i u online dostupnosti.
            </p>
          </div>
          <Button
            variant="secondary"
            leftIcon={<CalendarPlus className="h-4 w-4" />}
            onClick={() => setBreakOpen(true)}
          >
            Dodaj pauzu ili odsustvo
          </Button>
        </div>

        {groupedBlocks.length === 0 ? (
          <Panel className="mt-5">
            <p className="text-sm text-muted">Nema unesenih pauza ni odsustava u ovom periodu.</p>
          </Panel>
        ) : (
          <div className="mt-5 space-y-6">
            {groupedBlocks.map(([dateKey, dayBlocks]) => (
              <div key={dateKey}>
                <h3 className="text-xs font-medium text-muted">
                  {capitalizeFirst(formatDateLong(dateKey))}
                </h3>
                <Panel className="mt-1.5 py-1">
                  <ul>
                    {dayBlocks.map((block) => {
                      const member = (hairdressers.data ?? []).find(
                        (item) => item.id === block.hairdresserId,
                      )
                      return (
                        <li
                          key={block.id}
                          className="grid min-h-11 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 px-3 py-0.5 sm:px-4"
                        >
                          <span className="tabular w-24 shrink-0 text-sm font-medium text-ink sm:w-28">
                            {formatTimeRange(block.startsAt, block.endsAt)}
                          </span>
                          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="text-sm text-ink">{block.reason}</span>
                            <span className="min-w-0 truncate">
                              <StaffName
                                name={member?.displayName ?? 'Frizer'}
                                colorKey={member?.colorKey ?? '1'}
                              />
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-11 text-muted hover:text-danger"
                            aria-label={`Ukloni ${block.reason.toLowerCase()} ${member?.displayName ?? ''}`}
                            onClick={() => removeBlock(block)}
                            disabled={deleteBlock.isPending}
                          >
                            <Trash2 aria-hidden="true" className="h-4 w-4" />
                          </Button>
                        </li>
                      )
                    })}
                  </ul>
                </Panel>
              </div>
            ))}
          </div>
        )}
      </section>

      {breakOpen ? (
        <BreakDialog defaultDateKey={today} onClose={() => setBreakOpen(false)} />
      ) : null}
    </div>
  )
}

function DayHours({ intervals }: { intervals: WorkingHoursInterval[] }) {
  if (intervals.length === 0) return <span className="text-sm text-muted">Ne radi</span>
  return (
    <span className="tabular text-sm font-medium text-ink">
      {intervals.map((interval) => `${interval.start}–${interval.end}`).join(', ')}
    </span>
  )
}

/**
 * A simple aligned grid: one block per weekday, one column per hairdresser on
 * desktop, one row per hairdresser on phones. No borders or per-day cards.
 */
function TimeGrid({
  columns,
  rows,
}: {
  columns: ReactNode[]
  rows: Array<{ label: string; cells: ReactNode[] }>
}) {
  return (
    <div className="rounded-lg bg-surface px-5 py-4 sm:px-6">
      <div
        className="hidden pb-2 sm:grid sm:gap-x-6"
        style={{
          gridTemplateColumns: `minmax(96px, 0.6fr) repeat(${columns.length}, minmax(0, 1fr))`,
        }}
      >
        <div />
        {columns}
      </div>
      <div className="space-y-3 sm:space-y-0">
        {rows.map((row) => (
          <div key={row.label}>
            <div
              className="hidden items-baseline gap-x-6 py-2 sm:grid"
              style={{
                gridTemplateColumns: `minmax(96px, 0.6fr) repeat(${columns.length}, minmax(0, 1fr))`,
              }}
            >
              <div className="text-sm text-muted">{row.label}</div>
              {row.cells.map((cell, index) => (
                <div key={index}>{cell}</div>
              ))}
            </div>
            <div className="py-2 sm:hidden">
              <p className="text-sm text-muted">{row.label}</p>
              <dl className="mt-1.5 space-y-1">
                {row.cells.map((cell, index) => (
                  <div key={index} className="flex items-baseline justify-between gap-4 text-sm">
                    <dt className="flex items-center gap-2 text-xs text-muted">{columns[index]}</dt>
                    <dd>{cell}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function groupBlocksByDay(blocks: TimeBlock[]): Array<[string, TimeBlock[]]> {
  const groups = new Map<string, TimeBlock[]>()
  for (const block of [...blocks].sort(
    (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
  )) {
    const key = dateKeyFromInstant(block.startsAt)
    const current = groups.get(key)
    if (current) current.push(block)
    else groups.set(key, [block])
  }
  return Array.from(groups.entries())
}
