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
      {/*
       * Demo chrome, deliberately quiet: a hairline strip, not a coloured bar. The product
       * below it owns the screen; the demo notice only has to be legible, not loud. The
       * package preview switch lives in Postavke, where the packages are compared.
       */}
      <div className="border-b border-line bg-paper">
        <div className="mx-auto flex min-h-10 w-full max-w-[1600px] items-center gap-3 px-4 sm:px-6">
          <p className="min-w-0 truncate text-xs font-medium text-muted">
            <span className="sm:hidden">Demo</span>
            <span className="hidden sm:inline">Demo · podaci nisu stvarni</span>
          </p>

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
