import {
  CalendarDays,
  ExternalLink,
  Settings2,
  Sun,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'

import { LevelBadge } from '@/components/ui/Badges'
import { Skeleton } from '@/components/ui/Layout'
import { usePackageInfo, useSalon } from '@/data/queries'
import { cn } from '@/lib/cn'
import { formatKM } from '@/lib/format'
import { initials } from '@/lib/text'

import { DemoBanner, PublicDemoBar } from './DemoBanner'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/danas', label: 'Danas', icon: Sun },
  { to: '/kalendar', label: 'Kalendar', icon: CalendarDays },
  { to: '/klijenti', label: 'Klijenti', icon: UsersRound },
  { to: '/postavke', label: 'Postavke', icon: Settings2 },
]

function SalonMark({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-pine font-display text-base font-semibold text-paper"
    >
      {initials(name)}
    </span>
  )
}

function Sidebar() {
  const salon = useSalon()
  const packageInfo = usePackageInfo()
  const name = salon.data?.name ?? 'Studio Lana'
  const level = salon.data?.plan ?? 'level_2'

  return (
    <aside className="hidden w-[236px] shrink-0 border-r border-line bg-paper/80 lg:sticky lg:top-0 lg:flex lg:h-[calc(100dvh-2.75rem)] lg:flex-col">
      <div className="flex items-center gap-3 px-5 pb-7 pt-6">
        <SalonMark name={name} />
        <div className="min-w-0">
          <p className="truncate font-display text-lg leading-tight font-semibold tracking-tight text-ink">
            {name}
          </p>
          <p className="mt-0.5 text-xs text-muted">{salon.data?.city ?? 'Banja Luka'}</p>
        </div>
      </div>

      <nav aria-label="Glavna navigacija" className="px-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-surface text-pine shadow-[inset_0_0_0_1px_var(--color-line)]'
                      : 'text-muted hover:bg-surface/70 hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      aria-hidden="true"
                      className={cn('h-[1.15rem] w-[1.15rem]', isActive && 'text-pine')}
                    />
                    {item.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto space-y-3 p-4">
        {level === 'level_2' ? (
          <a
            href={`/rezervacija/${salon.data?.slug ?? 'studio-lana'}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 items-center gap-2 rounded-md border border-line bg-surface px-3 text-sm font-medium text-ink transition-colors hover:border-line-strong"
          >
            <ExternalLink aria-hidden="true" className="h-4 w-4 text-muted" />
            Javna stranica
          </a>
        ) : null}
        <NavLink
          to="/postavke"
          className="block rounded-lg border border-line bg-surface p-3.5 transition-colors hover:border-line-strong"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted">Paket</span>
            {salon.isPending ? <Skeleton className="h-5 w-14" /> : <LevelBadge level={level} />}
          </div>
          <p className="mt-2 font-display text-lg leading-none font-semibold tracking-tight text-ink">
            {packageInfo.data
              ? `${formatKM(packageInfo.data.pricePerHairdresserMinor)} / frizer`
              : '—'}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            {packageInfo.data
              ? `Aktivnih frizera: ${packageInfo.data.activeHairdressers} · ${formatKM(packageInfo.data.monthlyTotalMinor)} mjesečno`
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
    <div className="flex items-center gap-2.5 border-b border-line bg-paper/95 px-4 py-3 lg:hidden">
      <SalonMark name={name} />
      <div className="min-w-0">
        <p className="truncate font-display text-base leading-tight font-semibold tracking-tight text-ink">
          {name}
        </p>
        <p className="text-[0.7rem] text-muted">{salon.data?.city ?? 'Banja Luka'}</p>
      </div>
      <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-line-strong px-2.5 py-1 text-[0.65rem] font-semibold text-muted">
        Demo
      </span>
    </div>
  )
}

function MobileNav() {
  return (
    <nav
      aria-label="Glavna navigacija"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-14 flex-col items-center justify-center gap-1 text-[0.68rem] font-medium transition-colors',
                  isActive ? 'text-pine' : 'text-muted hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    aria-hidden="true"
                    className={cn('h-5 w-5', isActive ? 'text-pine' : 'text-muted')}
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
      <div className="mx-auto flex w-full max-w-[1500px]">
        <Sidebar />
        <div className="min-w-0 flex-1 pb-20 lg:pb-0">
          <MobileTopBar />
          <main
            id="main"
            ref={mainRef}
            tabIndex={-1}
            className="mx-auto w-full max-w-[1120px] px-4 pb-10 pt-5 outline-none sm:px-6 lg:px-10 lg:pt-8"
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
        className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 outline-none sm:px-6 sm:py-10"
      >
        <Outlet />
      </main>
    </div>
  )
}
