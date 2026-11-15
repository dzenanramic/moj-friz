import { CalendarDays, ExternalLink, Settings2, Sun, type LucideIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'

import { Skeleton } from '@/components/ui/Layout'
import { SalonMark } from '@/components/ui/SalonMark'
import { usePackageInfo, useSalon } from '@/data/queries'
import { cn } from '@/lib/cn'
import { formatKM } from '@/lib/format'

import { DemoBanner, PublicDemoBar } from './DemoBanner'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

// Clients have no entry of their own: a client is a name and a phone on an appointment. The
// screens and routes stay in the code for whenever that history earns its place in the nav.
const NAV_ITEMS: NavItem[] = [
  { to: '/danas', label: 'Danas', icon: Sun },
  { to: '/kalendar', label: 'Kalendar', icon: CalendarDays },
  { to: '/postavke', label: 'Postavke', icon: Settings2 },
]

function Sidebar() {
  const salon = useSalon()
  const packageInfo = usePackageInfo()
  const name = salon.data?.name ?? 'Studio Lana'
  const level = salon.data?.plan ?? 'level_2'

  return (
    <aside className="hidden w-[228px] shrink-0 lg:sticky lg:top-0 lg:flex lg:h-[calc(100dvh-2.5rem)] lg:flex-col">
      <div className="flex items-center gap-3 px-4 pb-8 pt-6">
        <SalonMark name={name} />
        <div className="min-w-0">
          <p className="display truncate text-[1.15rem] leading-tight text-ink">{name}</p>
          <p className="mt-0.5 truncate text-xs text-muted">{salon.data?.city ?? 'Banja Luka'}</p>
        </div>
      </div>

      <nav aria-label="Glavna navigacija">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    // The active screen is marked with a copper margin rule, the way a bookmark
                    // sits in a book — not with a filled card that competes with the content.
                    'relative flex min-h-10 items-center gap-3 rounded-sm px-3 text-sm transition-colors',
                    isActive
                      ? 'font-medium text-ink'
                      : 'text-muted hover:bg-surface hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute inset-y-1.5 left-0 w-[2px] rounded-full bg-accent-ui transition-opacity',
                        isActive ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <item.icon
                      aria-hidden="true"
                      className={cn(
                        'h-[1.1rem] w-[1.1rem]',
                        isActive ? 'text-primary' : 'text-muted',
                      )}
                    />
                    {item.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto space-y-4 px-4 pb-6 pt-4">
        {level === 'level_2' ? (
          <a
            href={`/rezervacija/${salon.data?.slug ?? 'studio-lana'}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-10 items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
          >
            <ExternalLink aria-hidden="true" className="h-4 w-4" />
            Javna stranica
          </a>
        ) : null}
        <NavLink to="/postavke" className="block rounded-md transition-colors hover:bg-surface">
          <p className="text-xs text-muted">
            {level === 'level_1' ? 'Paket 1' : 'Paket 2'} ·{' '}
            {packageInfo.isPending ? (
              <Skeleton className="inline-block h-3 w-16 align-middle" />
            ) : packageInfo.data ? (
              `${formatKM(packageInfo.data.pricePerHairdresserMinor)} / frizer`
            ) : (
              'cijena nije dostupna'
            )}
          </p>
          <p className="mt-1 text-xs text-muted">
            {packageInfo.data
              ? `Ukupno ${formatKM(packageInfo.data.monthlyTotalMinor)} mjesečno`
              : 'Informativni prikaz paketa'}
          </p>
        </NavLink>
      </div>
    </aside>
  )
}

function MobileTopBar() {
  const salon = useSalon()
  const name = salon.data?.name ?? 'Studio Lana'
  return (
    <div className="flex items-center gap-2.5 px-4 py-3 lg:hidden">
      <SalonMark name={name} size="sm" />
      <div className="min-w-0">
        <p className="display truncate text-[1.05rem] leading-tight text-ink">{name}</p>
        <p className="text-xs text-muted">{salon.data?.city ?? 'Banja Luka'}</p>
      </div>
    </div>
  )
}

function MobileNav() {
  return (
    <nav
      aria-label="Glavna navigacija"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-3">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-14 flex-col items-center justify-center gap-1 text-[0.7rem] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    aria-hidden="true"
                    className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-muted')}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function useRouteFocus() {
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    const main = mainRef.current
    if (main) main.focus({ preventScroll: true })
  }, [location.pathname])

  return mainRef
}

export function OwnerLayout() {
  const mainRef = useRouteFocus()

  return (
    <div className="min-h-dvh bg-paper">
      <a className="skip-link" href="#main">
        Preskoči na sadržaj
      </a>
      <DemoBanner />
      <div className="mx-auto flex w-full max-w-[1480px]">
        <Sidebar />
        <div className="min-w-0 flex-1 pb-20 lg:pb-0">
          <MobileTopBar />
          <main
            id="main"
            ref={mainRef}
            tabIndex={-1}
            className="mx-auto w-full max-w-[1080px] px-4  pt-4 outline-none sm:px-8 lg:px-12 lg:pt-8"
          >
            <Outlet />
          </main>
        </div>
      </div>
      <MobileNav />
    </div>
  )
}

export function PublicLayout() {
  const mainRef = useRef<HTMLElement>(null)
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    mainRef.current?.focus({ preventScroll: true })
  }, [location.pathname])

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <a className="skip-link" href="#public-main">
        Preskoči na sadržaj
      </a>
      <PublicDemoBar />
      <main
        id="public-main"
        ref={mainRef}
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 outline-none sm:px-8 sm:py-12"
      >
        <Outlet />
      </main>
    </div>
  )
}
