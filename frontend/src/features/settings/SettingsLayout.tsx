import { Clock3, Package, Scissors, UsersRound } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'

import { PageHeader } from '@/components/ui/Layout'
import { cn } from '@/lib/cn'
import { usePageTitle } from '@/lib/hooks'

const TABS = [
  { to: '/postavke', label: 'Paket', icon: Package, end: true },
  { to: '/postavke/usluge', label: 'Usluge', icon: Scissors, end: false },
  { to: '/postavke/frizeri', label: 'Frizeri', icon: UsersRound, end: false },
  { to: '/postavke/radno-vrijeme', label: 'Radno vrijeme', icon: Clock3, end: false },
]

export function SettingsLayout() {
  usePageTitle('Postavke')

  return (
    <div>
      <PageHeader
        title="Postavke"
        description="Paket, usluge, frizeri i radno vrijeme. U demou su ove stranice prikaz; uređivanje usluga i frizera dolazi uz pilot."
      />

      <nav aria-label="Postavke" className="mb-7 border-b border-line">
        <ul className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <li key={tab.to}>
              <NavLink
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    'inline-flex min-h-11 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-pine text-pine'
                      : 'border-transparent text-muted hover:border-line-strong hover:text-ink',
                  )
                }
              >
                <tab.icon aria-hidden="true" className="h-4 w-4" />
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
