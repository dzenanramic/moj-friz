import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/ui/Modal'
import { gatewayErrorMessage } from '@/data/gateway'
import { useResetDemo, useSalon, useSetDemoLevel } from '@/data/queries'
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
        'min-h-8 rounded-sm px-2.5 text-xs font-medium transition-colors',
        active ? 'bg-paper text-pine-strong' : 'text-paper hover:bg-pine-strong',
      )}
    >
      {label}
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
      <div className="bg-pine text-paper">
        <div className="mx-auto flex min-h-10 w-full max-w-[1600px] items-center gap-3 px-4 sm:px-6">
          <p className="min-w-0 truncate text-xs font-semibold">
            <span className="sm:hidden">Demo</span>
            <span className="hidden sm:inline">Demo · podaci nisu stvarni</span>
          </p>

          <div className="ml-auto flex items-center gap-1">
            <span className="mr-1.5 hidden text-xs text-paper md:inline">Prikaz paketa</span>
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
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="ml-2 inline-flex min-h-8 items-center gap-1.5 rounded-sm px-2 text-xs font-medium text-paper transition-colors hover:bg-pine-strong"
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
    <div className="bg-pine text-paper">
      <div className="mx-auto flex min-h-11 w-full max-w-5xl items-center gap-3 px-4 text-xs sm:px-8">
        <span className="font-semibold">Demo · podaci nisu stvarni</span>
        <a
          href="/"
          className="ml-auto inline-flex min-h-11 items-center rounded-xs px-2 font-medium text-paper underline decoration-paper underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
        >
          Demo početna
        </a>
      </div>
    </div>
  )
}
