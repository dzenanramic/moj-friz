import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'

import { useGateway } from '@/data/DataProvider'
import { queryKeys } from '@/data/queries'
import type { PublicAvailabilityQuery } from '@/data/types'

export interface DayAvailability {
  /** Slots still bookable on this day. */
  free: number
  closed: boolean
}

/**
 * Loads availability for every day in the strip at once, so the guest can see which days
 * actually have openings before tapping through them. One query per day, keyed exactly like
 * the selected day's query, so the chosen day is never fetched twice.
 */
export function useStripAvailability(
  base: Omit<PublicAvailabilityQuery, 'dateKey'> | null,
  dates: string[],
  enabled: boolean,
): Record<string, DayAvailability> {
  const gateway = useGateway()
  const results = useQueries({
    queries:
      enabled && base
        ? dates.map((dateKey) => ({
            queryKey: [...queryKeys.publicAvailability, { ...base, dateKey }],
            queryFn: () => gateway.getPublicAvailability({ ...base, dateKey }),
            enabled,
          }))
        : [],
  })

  return useMemo(() => {
    const map: Record<string, DayAvailability> = {}
    if (!enabled || !base) return map
    results.forEach((result, index) => {
      const dateKey = dates[index]
      if (!dateKey || !result.data) return
      map[dateKey] = {
        free: result.data.isClosed ? 0 : result.data.slots.length,
        closed: result.data.isClosed,
      }
    })
    return map
  }, [results, dates, enabled, base])
}
