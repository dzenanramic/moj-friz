import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/ui/Modal'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { gatewayErrorMessage } from '@/data/gateway'
import { useResetDemo } from '@/data/queries'

export function DemoBanner() {
  const navigate = useNavigate()
  const resetDemo = useResetDemo()
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <>
      <div className="bg-primary text-on-primary dark:border-b dark:border-line dark:bg-surface dark:text-ink">
        <div className="mx-auto flex min-h-11 w-full max-w-[1600px] items-center gap-3 px-4 sm:px-6">
          <p className="min-w-0 truncate text-xs font-semibold">
            <span className="sm:hidden">Demo</span>
            <span className="hidden sm:inline">Demo · podaci nisu stvarni</span>
          </p>

          <div className="ml-auto flex items-center gap-2 py-1">
            {/* <span className="mr-1.5 hidden text-xs text-on-primary md:inline dark:text-ink">
              Prikaz paketa
            </span> */}
            {/* <LevelButton
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
            /> */}
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="ml-2 inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-sm px-3 text-xs font-medium text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-primary dark:text-ink dark:hover:bg-paper dark:focus-visible:outline-primary"
              aria-label="Resetuj demo"
            >
              <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Resetuj demo</span>
            </button>
            <ThemeToggle className="h-11 w-11 dark:text-ink dark:hover:bg-paper dark:focus-visible:outline-primary" />
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
    <div className="bg-primary text-on-primary">
      <div className="mx-auto flex min-h-11 w-full max-w-5xl items-center gap-3 px-4 text-xs sm:px-8">
        <span className="font-semibold">Demo · podaci nisu stvarni</span>
        <ThemeToggle />
        <a
          href="/"
          className="ml-auto inline-flex min-h-11 items-center rounded-xs px-2 font-medium text-on-primary underline decoration-on-primary underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-primary"
        >
          Demo početna
        </a>
      </div>
    </div>
  )
}
