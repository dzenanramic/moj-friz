import { describe, expect, it, vi } from 'vitest'

import { CALENDAR_VIEW_STORAGE_KEY, readStoredView, storeView } from './useCalendarView'

describe('calendar view choice', () => {
  it('is unset until the owner picks a view', () => {
    expect(readStoredView()).toBeNull()
  })

  it('remembers the chosen view between visits', () => {
    storeView('grid')
    expect(window.localStorage.getItem(CALENDAR_VIEW_STORAGE_KEY)).toBe('grid')
    expect(readStoredView()).toBe('grid')

    storeView('agenda')
    expect(readStoredView()).toBe('agenda')
  })

  it('ignores a value it did not write', () => {
    window.localStorage.setItem(CALENDAR_VIEW_STORAGE_KEY, 'week')
    expect(readStoredView()).toBeNull()
  })

  it('survives storage that refuses to write', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    expect(() => storeView('grid')).not.toThrow()
    setItem.mockRestore()
  })
})
