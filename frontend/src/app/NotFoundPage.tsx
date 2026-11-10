import { ButtonLink } from '@/components/ui/Button'
import { usePageTitle } from '@/lib/hooks'

import { PublicDemoBar } from './DemoBanner'

export function NotFoundPage() {
  usePageTitle('Stranica nije pronađena')

  return (
    <div className="min-h-dvh bg-paper">
      <PublicDemoBar />
      <main className="mx-auto flex min-h-[70dvh] w-full max-w-3xl flex-col justify-center px-4 py-12 sm:px-6">
        <p className="text-sm font-medium text-muted">404</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink">
          Ova stranica ne postoji.
        </h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          Link je možda pogrešan ili je demo podatak u međuvremenu resetovan. Vratite se na početak
          demo prikaza.
        </p>
        <div className="mt-7 flex flex-wrap gap-2">
          <ButtonLink to="/danas">Otvori današnji raspored</ButtonLink>
          <ButtonLink to="/" variant="secondary">
            Demo početna
          </ButtonLink>
        </div>
      </main>
    </div>
  )
}
