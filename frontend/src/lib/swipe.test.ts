import { describe, expect, it } from 'vitest'

import { resolveSwipe } from './swipe'

describe('resolveSwipe', () => {
  it('reads a clear left drag as a step forward and a right drag as a step back', () => {
    expect(resolveSwipe({ x: 300, y: 100 }, { x: 200, y: 102 })).toBe('left')
    expect(resolveSwipe({ x: 100, y: 100 }, { x: 200, y: 98 })).toBe('right')
  })

  it('ignores taps and short drags', () => {
    expect(resolveSwipe({ x: 200, y: 100 }, { x: 200, y: 100 })).toBeNull()
    expect(resolveSwipe({ x: 200, y: 100 }, { x: 170, y: 100 })).toBeNull()
  })

  it('lets a vertical page scroll win over a mostly vertical drag', () => {
    expect(resolveSwipe({ x: 200, y: 300 }, { x: 170, y: 100 })).toBeNull()
  })

  it('treats a diagonal drag that is mostly horizontal as a swipe', () => {
    expect(resolveSwipe({ x: 300, y: 100 }, { x: 200, y: 140 })).toBe('left')
  })
})
