import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/ui/Modal'
import { AppMark } from '@/components/ui/SalonMark'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { gatewayErrorMessage } from '@/data/gateway'
import { useResetDemo } from '@/data/queries'
import { APP_NAME } from '@/lib/hooks'

export function DemoBanner() {
  const navigate = useNavigate()
  const resetDemo = useResetDemo()
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <>
      {/*
       * The product's name, not the salon's. Whatever salon is signed in, this strip is the
       * application: one identity for every subscriber, one strip at every width (the phone no
       * longer needs a second header of its own). The demo notice rides beside it as a small
       * pill — legible, not loud — and the strip stays a hairline, not a coloured bar. The
       * salon's own name belongs to its data and shows where it is being worked on: the public
       * booking page, Postavke → Paket. The package preview switch lives in Postavke too.
       */}
      <div className="border-b border-line bg-paper">
        <div className="mx-auto flex min-h-12 w-full max-w-[1600px] items-center gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <AppMark size="sm" />
            <p className="display truncate text-[1.15rem] leading-tight text-ink">{APP_NAME}</p>
          </div>
          <span
            aria-label="Demo · podaci nisu stvarni"
            className="ml-1 inline-flex shrink-0 items-center rounded-full bg-accent-tint px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-accent-ui uppercase"
          >
            Demo
          </span>

          <div className="ml-auto flex items-center gap-1 py-0.5">
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-sm px-2.5 text-xs font-medium text-muted transition-colors hover:bg-surface hover:text-ink"
              aria-label="Resetuj demo"
            >
              <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Resetuj demo</span>
            </button>
            <ThemeToggle className="h-9 w-9 text-muted hover:bg-surface hover:text-ink" />
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
    <div className="border-b border-line bg-paper">
      <div className="mx-auto flex min-h-10 w-full max-w-5xl items-center gap-3 px-4 text-xs sm:px-8">
        <span className="font-medium text-muted">Demo · podaci nisu stvarni</span>
        <ThemeToggle className="h-9 w-9 text-muted hover:bg-surface hover:text-ink" />
        <a
          href="/"
          className="ml-auto inline-flex min-h-9 items-center rounded-xs px-2 font-medium text-muted underline decoration-line underline-offset-4 hover:text-ink hover:decoration-ink"
        >
          Demo početna
        </a>
      </div>
    </div>
  )
}
