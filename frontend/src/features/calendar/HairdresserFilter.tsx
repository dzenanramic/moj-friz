import * as Dialog from '@radix-ui/react-dialog'
import { Check, ChevronDown, UsersRound, X } from 'lucide-react'
import { useState } from 'react'

import type { Hairdresser } from '@/data/types'
import { cn } from '@/lib/cn'

/**
 * The hairdresser filter as one control instead of one chip per name.
 *
 * Three chips took a whole row and grew with every new hairdresser; a salon with eight
 * would push the calendar off the screen. This shows only the current choice, and the
 * full list opens on demand, coloured with each hairdresser's own staff colour.
 */
export function HairdresserFilter({
  hairdressers,
  value,
  onChange,
}: {
  hairdressers: Hairdresser[]
  /** 'all' or a hairdresser id. */
  value: string
  onChange: (next: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = hairdressers.find((hairdresser) => hairdresser.id === value)
  const label = selected?.displayName ?? 'Svi frizeri'

  const choose = (next: string) => {
    onChange(next)
    setOpen(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={`Filter po frizeru: ${label}`}
          className={cn(
            'inline-flex min-h-9 max-w-[11rem] items-center gap-2 rounded-md px-2.5 text-sm transition-colors',
            selected
              ? 'bg-surface font-medium text-ink ring-1 ring-inset ring-line'
              : 'text-muted hover:bg-surface hover:text-ink',
          )}
        >
          {selected ? (
            <span
              data-staff={selected.colorKey}
              aria-hidden="true"
              className="staff-bar h-2 w-2 shrink-0 rounded-full"
            />
          ) : (
            <UsersRound aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="truncate">{label}</span>
          <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-muted" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        {/* On a phone this arrives as a sheet from the bottom, on a desktop as a small panel. */}
        <Dialog.Content
          className="dialog-content fixed inset-x-0 bottom-0 z-51 max-h-[80dvh] overflow-y-auto rounded-t-xl bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-sheet sm:inset-x-auto sm:top-1/2 sm:right-[max(1rem,calc((100vw-1080px)/2+3rem))] sm:bottom-auto sm:left-auto sm:w-72 sm:-translate-y-1/2 sm:rounded-xl sm:p-3"
          aria-describedby={undefined}
        >
          <div className="flex items-start justify-between gap-3 pb-2">
            <Dialog.Title className="text-sm font-semibold text-ink">
              Prikaži raspored za
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Zatvori"
                className="-mt-1 -mr-1 inline-flex h-9 w-9 items-center justify-center rounded-sm text-muted transition-colors hover:bg-paper hover:text-ink"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <div role="radiogroup" aria-label="Filter po frizeru" className="space-y-0.5">
            <FilterOption label="Sve frizere" checked={!selected} onSelect={() => choose('all')} />
            {hairdressers.map((hairdresser) => (
              <FilterOption
                key={hairdresser.id}
                label={hairdresser.displayName}
                colorKey={hairdresser.colorKey}
                checked={selected?.id === hairdresser.id}
                onSelect={() => choose(hairdresser.id)}
              />
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function FilterOption({
  label,
  checked,
  onSelect,
  colorKey,
}: {
  label: string
  checked: boolean
  onSelect: () => void
  colorKey?: Hairdresser['colorKey']
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      data-staff={colorKey}
      className={cn(
        'flex min-h-11 w-full items-center gap-2.5 rounded-sm px-2.5 text-left text-sm transition-colors',
        checked ? 'bg-paper font-medium text-ink' : 'text-ink hover:bg-paper',
      )}
    >
      {colorKey ? (
        <span aria-hidden="true" className="staff-bar h-2 w-2 shrink-0 rounded-full" />
      ) : (
        <UsersRound aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-muted" />
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {checked ? <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" /> : null}
    </button>
  )
}
