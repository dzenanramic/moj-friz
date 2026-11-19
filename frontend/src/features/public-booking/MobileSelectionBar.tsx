import { Pencil } from 'lucide-react'

import { cn } from '@/lib/cn'

export interface SelectionSummary {
  service?: string
  hairdresser?: string
  when?: string
}

/**
 * On a phone the summary panel is hidden, so the running selection sits in one bar at the
 * foot of the screen while the guest is choosing. It is an anchor, not a menu: opening it
 * returns to the first step so any choice can be changed.
 */
export function MobileSelectionBar({
  summary,
  visible,
  onEdit,
}: {
  summary: SelectionSummary
  visible: boolean
  onEdit: () => void
}) {
  const picked = [summary.service, summary.hairdresser, summary.when].filter(Boolean)
  if (!visible || picked.length === 0) return null

  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface shadow-[0_-8px_24px_-20px_rgb(20_24_21/0.5)] lg:hidden">
      <div className="flex w-full items-center gap-3 px-4 py-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted">Izbor</p>
          <p className="mt-0.5 truncate text-sm font-medium text-ink">{picked.join(' · ')}</p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className={cn(
            'inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-sm px-2 text-sm font-medium text-primary transition-colors',
            'hover:bg-primary-tint',
          )}
        >
          <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
          Promijeni
        </button>
      </div>
    </div>
  )
}
