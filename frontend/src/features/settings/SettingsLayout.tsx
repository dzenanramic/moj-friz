import { NavLink, Outlet } from 'react-router'

import { PageHeader } from '@/components/ui/Layout'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/cn'
import { usePageTitle } from '@/lib/hooks'

const TABS = [
  { to: '/postavke', label: 'Paket', end: true },
  { to: '/postavke/usluge', label: 'Usluge', end: false },
  { to: '/postavke/frizeri', label: 'Frizeri', end: false },
  { to: '/postavke/radno-vrijeme', label: 'Radno vrijeme', end: false },
]

/**
 * The owner's own theme switch lives here, first thing on the page. It is the only place the
 * choice is explained; the demo bar carries the same button for convenience.
 */
function AppearanceSetting() {
  const { theme } = useTheme()
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-surface px-4 py-3 sm:px-5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">Izgled</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">
          {theme === 'dark' ? 'Tamna tema' : 'Svijetla tema'} · izbor se pamti u ovom pregledniku.
          Bez izbora stranica prati postavku telefona.
        </p>
      </div>
      <div className="flex items-center gap-2.5">
        <span aria-hidden="true" className="text-xs text-muted">
          {theme === 'dark' ? 'Tamno' : 'Svjetlo'}
        </span>
        <ThemeToggle variant="setting" />
      </div>
    </div>
  )
}

export function SettingsLayout() {
  usePageTitle('Postavke')

  return (
    <div>
      <PageHeader
        title="Postavke"
        description="Paket, usluge, frizeri i radno vrijeme. Ove stranice su u demou samo prikaz; uređivanje dolazi uz pilot."
      />

      <AppearanceSetting />

      <nav aria-label="Postavke" className="mb-9">
        <ul className="flex gap-5 overflow-x-auto border-b border-line">
          {TABS.map((tab) => (
            <li key={tab.to}>
              <NavLink
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    'inline-flex min-h-11 items-center whitespace-nowrap border-b-2 text-sm transition-colors',
                    isActive
                      ? 'border-primary font-medium text-ink'
                      : 'border-transparent text-muted hover:text-ink',
                  )
                }
              >
                {tab.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <Outlet />
    </div>
  )
}
