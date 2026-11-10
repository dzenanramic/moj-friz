import { ChevronLeft, ChevronRight, Search, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

import { Avatar, EmptyState, ErrorState, PageHeader, Panel, Skeleton } from '@/components/ui/Layout'
import { Input } from '@/components/ui/form'
import { useClients } from '@/data/queries'
import { formatClientCount } from '@/lib/format'
import { useDebouncedValue, usePageTitle } from '@/lib/hooks'

export function ClientsPage() {
  usePageTitle('Klijenti')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search, 220)
  const clients = useClients(debouncedSearch, page, 8)

  return (
    <div>
      <PageHeader
        title="Klijenti"
        description={
          clients.data
            ? `${formatClientCount(clients.data.total)} · pretraga po imenu ili telefonu`
            : 'Pretraga po imenu ili telefonu'
        }
      />

      <div className="relative mb-4 max-w-xl">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        />
        <Input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
          placeholder="Pretraži klijente…"
          aria-label="Pretraži klijente po imenu ili telefonu"
          className="pl-9"
        />
      </div>

      {clients.isError ? (
        <ErrorState title="Klijenti se nisu učitali." onRetry={() => void clients.refetch()} />
      ) : clients.isPending ? (
        <Panel className="p-2">
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 px-3 py-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ) : clients.data && clients.data.items.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="Nema pronađenih klijenata."
          description={
            search
              ? 'Provjerite ime ili broj telefona, ili obrišite pretragu.'
              : 'Klijenti se dodaju prilikom prvog termina.'
          }
          action={
            search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-sm font-medium text-pine underline underline-offset-4"
              >
                Obriši pretragu
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          <Panel className="overflow-hidden">
            <ul className="divide-y divide-line">
              {(clients.data?.items ?? []).map((client) => (
                <li key={client.id}>
                  <Link
                    to={`/klijenti/${client.id}`}
                    className="flex min-h-[68px] items-center gap-3 px-4 py-3 transition-colors hover:bg-paper/70 sm:px-5"
                  >
                    <Avatar name={client.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{client.name}</p>
                      <p className="mt-0.5 text-xs text-muted">{client.phoneOriginal}</p>
                    </div>
                    {client.notes ? (
                      <span className="hidden rounded-full border border-line px-2.5 py-1 text-[0.65rem] text-muted sm:inline">
                        Napomena
                      </span>
                    ) : null}
                    <ChevronRight
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-line-strong"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>

          {clients.data && clients.data.totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-muted">
                Stranica {clients.data.page} od {clients.data.totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={clients.data.page <= 1}
                  aria-label="Prethodna stranica"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line bg-surface text-muted transition-colors hover:text-ink disabled:opacity-40"
                >
                  <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPage((current) => Math.min(clients.data!.totalPages, current + 1))
                  }
                  disabled={clients.data.page >= clients.data.totalPages}
                  aria-label="Sljedeća stranica"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line bg-surface text-muted transition-colors hover:text-ink disabled:opacity-40"
                >
                  <ChevronRight aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <p className="mt-6 text-xs leading-relaxed text-muted">
        Demo prikaz klijenata. Ne unosite stvarne lične podatke. Klijent se ne može obrisati iz ovog
        prikaza; brisanje je predviđeno kao posebna administrativna procedura u pilotu.
      </p>
    </div>
  )
}
