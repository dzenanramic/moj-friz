import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/ui/Modal'
import { useResetDemo, useSalon, useSetDemoLevel } from '@/data/queries'
import { gatewayErrorMessage } from '@/data/gateway'
import { cn } from '@/lib/cn'

import type { PlanLevel } from '@/data/types'

function LevelButton({
  level,
  active,
  pending,
  onClick,
}: {
  level: PlanLevel
  active: boolean
  pending: boolean
  onClick: () => void
}) {
  const label = level === 'level_1' ? 'Paket 1' : 'Paket 2'
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={`Prikaži ${label}`}
      disabled={pending}
      onClick={onClick}
      className={cn(
        'min-h-8 rounded-sm px-2.5 text-xs font-semibold transition-colors sm:px-3',
        active ? 'bg-paper text-pine' : 'text-paper/75 hover:bg-paper/10 hover:text-paper',
      )}
    >
      <span className="sm:hidden">{level === 'level_1' ? '1' : '2'}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

export function DemoBanner() {
  const navigate = useNavigate()
  const salon = useSalon()
  const setLevel = useSetDemoLevel()
  const resetDemo = useResetDemo()
  const [confirmReset, setConfirmReset] = useState(false)
  const level = salon.data?.plan ?? 'level_2'

  const changeLevel = (next: PlanLevel) => {
    if (next === level) return
    setLevel.mutate(next, {
      onSuccess: () => {
        toast.success(`Prikaz je prebačen na ${next === 'level_1' ? 'Paket 1' : 'Paket 2'}.`)
      },
      onError: (error) => toast.error(gatewayErrorMessage(error)),
    })
  }

  return (
    <>
      <div className="border-b border-ink/10 bg-pine text-paper">
        <div className="mx-auto flex min-h-11 w-full max-w-[1600px] items-center gap-2 px-3 sm:gap-3 sm:px-5">
          <span className="inline-flex min-w-0 items-center gap-2 text-xs font-semibold tracking-[0.01em] sm:text-[0.8rem]">
            <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-amber" />
            <span className="truncate">Demo — podaci nisu stvarni</span>
          </span>

          <div className="ml-auto flex items-center gap-1.5">
            <span className="hidden text-xs text-paper/60 md:inline">Prikaz paketa</span>
            <div
              role="group"
              aria-label="Demo prikaz paketa"
              className="flex items-center gap-0.5 rounded-md border border-paper/25 p-0.5"
            >
              <LevelButton
                level="level_1"
                active={level === 'level_1'}
                pending={setLevel.isPending}
                onClick={() => changeLevel('level_1')}
              />
              <LevelButton
                level="level_2"
                active={level === 'level_2'}
                pending={setLevel.isPending}
                onClick={() => changeLevel('level_2')}
              />
            </div>
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-sm px-2 text-xs font-medium text-paper/80 transition-colors hover:bg-paper/10 hover:text-paper sm:px-2.5"
              aria-label="Resetuj demo"
            >
              <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Resetuj demo</span>
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Resetovati demo?"
        description="Brišu se svi uneseni termini, pauze i javne rezervacije u ovom pregledniku. Vraćaju se početni izmišljeni podaci i paket 2."
        confirmLabel="Resetuj demo"
        pending={resetDemo.isPending}
        onConfirm={() => {
          resetDemo.mutate(undefined, {
            onSuccess: () => {
              navigate('/')
              toast.success('Demo je resetovan na početno stanje.')
            },
            onError: (error) => toast.error(gatewayErrorMessage(error)),
          })
        }}
      />
    </>
  )
}

export function PublicDemoBar() {
  return (
    <div className="border-b border-ink/10 bg-pine text-paper">
      <div className="mx-auto flex min-h-10 w-full max-w-5xl items-center gap-2 px-4 py-2 text-xs sm:px-6">
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-amber" />
        <span className="font-semibold">Demo — podaci nisu stvarni</span>
        <a
          href="/"
          className="ml-auto inline-flex min-h-8 items-center rounded-sm px-2 font-medium text-paper/80 underline decoration-paper/30 underline-offset-4 hover:text-paper"
        >
          Demo početna
        </a>
      </div>
    </div>
  )
}
