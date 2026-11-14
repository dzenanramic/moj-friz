import { ChevronLeft, ChevronRight, Search, UsersRound, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

import { Avatar, EmptyState, ErrorState, PageHeader, Panel, Skeleton } from '@/components/ui/Layout'
import { Input } from '@/components/ui/form'
import { useClients } from '@/data/queries'
import { useDebouncedValue, usePageTitle } from '@/lib/hooks'

/** One page holds enough to scan without turning into a scroll. */
const PAGE_SIZE = 7

export function ClientsPage() {
  usePageTitle('Klijenti')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search, 220)
  const clients = useClients(debouncedSearch, page, PAGE_SIZE)

  const searchField = (
    <div className="relative">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
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
        className="pl-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {search ? (
        <button
          type="button"
          onClick={() => {
            setSearch('')
            setPage(1)
          }}
          aria-label="Obriši pretragu"
          className="absolute top-1/2 right-1.5 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-sm text-muted transition-colors hover:bg-paper hover:text-ink"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )

  return (
    <div>
      {/* The search belongs with the title: one row on desktop, stacked on a phone. */}
      <PageHeader title="Klijenti" aside={searchField} />

      {clients.isError ? (
        <ErrorState title="Klijenti se nisu učitali" onRetry={() => void clients.refetch()} />
      ) : clients.isPending ? (
        <Panel className="py-1">
          <div>
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3.5 border-b border-line px-4 py-3.5 last:border-b-0 sm:px-5"
              >
                <Skeleton className="h-10 w-10 rounded-md" />
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
          title="Nema pronađenih klijenata"
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
          <Panel className="py-1">
            <ul>
              {(clients.data?.items ?? []).map((client) => (
                <li key={client.id} className="border-b border-line last:border-b-0">
                  <Link
                    to={`/klijenti/${client.id}`}
                    className="group flex min-h-[68px] items-center gap-3.5 py-3 pr-4 pl-4 transition-colors hover:bg-paper focus-visible:-outline-offset-2 sm:gap-4 sm:pr-5 sm:pl-5"
                  >
                    <Avatar name={client.name} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.95rem] font-semibold text-ink">
                        {client.name}
                      </p>
                      <p className="tabular mt-0.5 text-xs text-muted">{client.phoneOriginal}</p>
                    </div>
                    {client.notes ? (
                      <span className="hidden shrink-0 items-center gap-1.5 text-xs text-muted sm:inline-flex">
                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-amber" />
                        Napomena
                      </span>
                    ) : null}
                    <span className="flex w-6 shrink-0 items-center justify-center self-stretch text-line-strong transition-colors group-hover:text-pine">
                      <ChevronRight aria-hidden="true" className="h-4 w-4" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-muted">
              {clients.data
                ? `${clients.data.total} ${clients.data.total === 1 ? 'klijent' : 'klijenata'}`
                : null}
              {clients.data && clients.data.totalPages > 1
                ? ` · stranica ${clients.data.page} od ${clients.data.totalPages}`
                : null}
            </p>
            {clients.data && clients.data.totalPages > 1 ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={clients.data.page <= 1}
                  aria-label="Prethodna stranica"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-sm text-muted transition-colors hover:bg-surface hover:text-ink disabled:opacity-40"
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
                  className="inline-flex h-11 w-11 items-center justify-center rounded-sm text-muted transition-colors hover:bg-surface hover:text-ink disabled:opacity-40"
                >
                  <ChevronRight aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <span />
            )}
          </div>
        </>
      )}
    </div>
  )
}
