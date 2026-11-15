import { cn } from '@/lib/cn'
import { initials } from '@/lib/text'

/**
 * The salon's monogram, the owner's and the guest's first sign of the same place.
 *
 * The owner mark is the brand blue; the public booking page uses `tone="ink"` instead. It is
 * a monogram rather than an app icon: the display face, set tight, on a squared mark.
 */
export function SalonMark({
  name,
  size = 'md',
  tone = 'brand',
}: {
  name: string
  size?: 'md' | 'sm'
  tone?: 'brand' | 'ink'
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'display flex shrink-0 items-center justify-center leading-none tracking-tight',
        tone === 'brand' ? 'bg-primary text-on-primary' : 'bg-ink text-paper',
        size === 'sm' ? 'h-8 w-8 rounded-xs text-[0.95rem]' : 'h-9 w-9 rounded-xs text-[1.05rem]',
      )}
    >
      {initials(name)}
    </span>
  )
}
