import { useRef, type TouchEvent } from 'react'

/** How far a finger must travel horizontally before it counts as a swipe. */
export const SWIPE_MIN_DISTANCE = 48
/** A swipe must be mostly horizontal: a mostly vertical drag stays a page scroll. */
export const SWIPE_MAX_ANGLE_RATIO = 0.75

export type SwipeDirection = 'left' | 'right'

interface Point {
  x: number
  y: number
}

/**
 * Decides whether a finished drag is a swipe, and which way.
 *
 * `left` means the finger moved left, which should advance to the next item; `right`
 * means the opposite. Vertical browsing distance (a page scroll) never counts, and a
 * slow drag that ends back near where it started never counts either.
 */
export function resolveSwipe(start: Point, end: Point): SwipeDirection | null {
  const dx = end.x - start.x
  const dy = end.y - start.y
  if (Math.abs(dx) < SWIPE_MIN_DISTANCE) return null
  if (Math.abs(dy) > Math.abs(dx) * SWIPE_MAX_ANGLE_RATIO) return null
  return dx < 0 ? 'left' : 'right'
}

/**
 * Swipe left and right with a finger. Attach the returned handlers to the element that
 * should respond. It only reports a gesture; the caller decides what "next" means.
 *
 * It uses touch events, not pointer events, so a horizontal scroll inside the element
 * keeps working and a vertical page scroll is never blocked.
 */
export function useSwipe(
  onSwipe: (direction: SwipeDirection) => void,
  options: { enabled?: boolean } = {},
): {
  onTouchStart: (event: TouchEvent) => void
  onTouchEnd: (event: TouchEvent) => void
  onTouchCancel: () => void
} {
  const startRef = useRef<Point | null>(null)
  const enabled = options.enabled ?? true

  return {
    onTouchStart: (event) => {
      if (!enabled) return
      const touch = event.touches[0]
      startRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null
    },
    onTouchEnd: (event) => {
      const start = startRef.current
      startRef.current = null
      if (!enabled || !start) return
      const touch = event.changedTouches[0]
      if (!touch) return
      const direction = resolveSwipe(start, { x: touch.clientX, y: touch.clientY })
      if (direction) onSwipe(direction)
    },
    onTouchCancel: () => {
      startRef.current = null
    },
  }
}
