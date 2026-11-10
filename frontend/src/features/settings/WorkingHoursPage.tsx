import { CalendarPlus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Avatar, ErrorState, Panel, Skeleton } from '@/components/ui/Layout'
import { Button } from '@/components/ui/Button'
import { gatewayErrorMessage } from '@/data/gateway'
import { useDeleteTimeBlock, useHairdressers, useTimeBlocks, useWorkingHours } from '@/data/queries'
import type { TimeBlock } from '@/data/types'
import { cn } from '@/lib/cn'
import {
  addDaysToDateKey,
  dateKeyFromInstant,
  formatDateLong,
  formatTimeRange,
  isoWeekdayLabel,
  startOfSalonDay,
  todayDateKey,
} from '@/lib/time'
import { capitalizeFirst } from '@/lib/time'

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
        title="Radno vrijeme se nije učitalo."
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
      <div className="space-y-2">
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
    <div className="space-y-8">
      <section aria-labelledby="weekly-hours">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="weekly-hours"
              className="font-display text-2xl font-semibold tracking-tight text-ink"
            >
              Sedmično radno vrijeme
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Radno vrijeme se ponavlja svake sedmice. Dan bez intervala znači da frizer ne radi.
              Vremenska zona: Europe/Sarajevo.
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

        <div className="mt-4 space-y-3">
          {staff.map((member) => (
            <Panel key={member.id} as="article" className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <Avatar name={member.displayName} colorKey={member.colorKey} />
                <div>
                  <h3 className="text-sm font-semibold text-ink">{member.displayName}</h3>
                  <p className="text-xs text-muted">Sedmični raspored</p>
                </div>
              </div>
              <dl className="mt-4 divide-y divide-line border-t border-line">
                {Array.from({ length: 7 }).map((_, weekday) => {
                  const intervals = hours.filter(
                    (interval) =>
                      interval.hairdresserId === member.id && interval.weekday === weekday,
                  )
                  return (
                    <div
                      key={weekday}
                      className="grid grid-cols-[112px_minmax(0,1fr)] items-baseline gap-3 py-2 text-sm"
                    >
                      <dt className="text-muted">{capitalizeFirst(isoWeekdayLabel(weekday))}</dt>
                      <dd>
                        {intervals.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {intervals.map((interval) => (
                              <span
                                key={interval.id}
                                className="time-gutter-label rounded-sm bg-pine-soft px-2 py-0.5 text-xs font-medium text-pine"
                              >
                                {interval.start}–{interval.end}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted">Zatvoreno</span>
                        )}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </Panel>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Sedmični raspored je u demou prikaz. Uređivanje radnog vremena dolazi uz pilot i tada se
          provjerava da promjena ne ostavlja postojeće termine van radnog vremena.
        </p>
      </section>

      <section aria-labelledby="time-off">
        <div>
          <h2 id="time-off" className="font-display text-2xl font-semibold tracking-tight text-ink">
            Pauze i odsustva
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Naredne dvije sedmice. Pauza ili odsustvo blokiraju vrijeme i u online dostupnosti.
          </p>
        </div>

        {groupedBlocks.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-line-strong px-5 py-8 text-center">
            <p className="text-sm text-muted">Nema unesenih pauza ni odsustava u ovom periodu.</p>
            <Button
              variant="secondary"
              className="mt-4"
              leftIcon={<CalendarPlus className="h-4 w-4" />}
              onClick={() => setBreakOpen(true)}
            >
              Dodaj pauzu
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            {groupedBlocks.map(([dateKey, dayBlocks]) => (
              <div key={dateKey}>
                <h3 className="text-xs font-semibold text-muted">
                  {capitalizeFirst(formatDateLong(dateKey))}
                </h3>
                <Panel className="mt-2 overflow-hidden">
                  <ul className="divide-y divide-line">
                    {dayBlocks.map((block) => {
                      const member = (hairdressers.data ?? []).find(
                        (item) => item.id === block.hairdresserId,
                      )
                      return (
                        <li key={block.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                          <span className="time-gutter-label w-28 shrink-0 text-sm font-medium text-ink">
                            {formatTimeRange(block.startsAt, block.endsAt)}
                          </span>
                          <span className="text-sm text-ink">{block.reason}</span>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 text-xs text-muted',
                              member?.colorKey && 'staff-text',
                            )}
                            data-staff={member?.colorKey}
                          >
                            <span
                              aria-hidden="true"
                              className="staff-bar h-1.5 w-1.5 rounded-full"
                            />
                            {member?.displayName ?? 'Frizer'}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-auto text-muted hover:text-danger"
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
