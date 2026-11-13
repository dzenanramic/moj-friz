import { NavLink, Outlet } from 'react-router'

import { PageHeader } from '@/components/ui/Layout'
import { cn } from '@/lib/cn'
import { usePageTitle } from '@/lib/hooks'

const TABS = [
  { to: '/postavke', label: 'Paket', end: true },
  { to: '/postavke/usluge', label: 'Usluge', end: false },
  { to: '/postavke/frizeri', label: 'Frizeri', end: false },
  { to: '/postavke/radno-vrijeme', label: 'Radno vrijeme', end: false },
]

export function SettingsLayout() {
  usePageTitle('Postavke')

  return (
    <div>
      <PageHeader
        title="Postavke"
        description="Paket, usluge, frizeri i radno vrijeme. Ove stranice su u demou prikaz; uređivanje dolazi uz pilot."
      />

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
                      ? 'border-pine font-medium text-ink'
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
