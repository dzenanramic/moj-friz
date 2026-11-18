import { BrowserRouter, Route, Routes } from 'react-router'
import { Toaster } from 'sonner'

import { DataProvider } from '@/data/DataProvider'
import { ClientDetailPage } from '@/features/clients/ClientDetailPage'
import { ClientsPage } from '@/features/clients/ClientsPage'
import { CalendarPage } from '@/features/calendar/CalendarPage'
import { ConfirmationPage } from '@/features/public-booking/ConfirmationPage'
import { ManageAppointmentPage } from '@/features/public-booking/ManageAppointmentPage'
import { PrivacyPage } from '@/features/public-booking/PrivacyPage'
import { PublicBookingPage } from '@/features/public-booking/PublicBookingPage'
import { HairdressersPage } from '@/features/settings/HairdressersPage'
import { PackagePage } from '@/features/settings/PackagePage'
import { ServicesPage } from '@/features/settings/ServicesPage'
import { SettingsLayout } from '@/features/settings/SettingsLayout'
import { StatisticsPage } from '@/features/settings/StatisticsPage'
import { WorkingHoursPage } from '@/features/settings/WorkingHoursPage'
import { TodayPage } from '@/features/today/TodayPage'

import { AppErrorBoundary } from './app/ErrorBoundary'
import { DemoAccessPage } from './app/DemoAccessPage'
import { NotFoundPage } from './app/NotFoundPage'
import { OwnerLayout, PublicLayout } from './app/AppShell'

export function App() {
  return (
    <AppErrorBoundary>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DemoAccessPage />} />
            <Route element={<OwnerLayout />}>
              <Route path="/danas" element={<TodayPage />} />
              <Route path="/kalendar" element={<CalendarPage />} />
              <Route path="/klijenti" element={<ClientsPage />} />
              <Route path="/klijenti/:id" element={<ClientDetailPage />} />
              <Route path="/postavke" element={<SettingsLayout />}>
                <Route index element={<PackagePage />} />
                <Route path="statistika" element={<StatisticsPage />} />
                <Route path="usluge" element={<ServicesPage />} />
                <Route path="frizeri" element={<HairdressersPage />} />
                <Route path="radno-vrijeme" element={<WorkingHoursPage />} />
              </Route>
            </Route>
            <Route element={<PublicLayout />}>
              <Route path="/rezervacija/:slug" element={<PublicBookingPage />} />
              <Route path="/rezervacija/:slug/potvrda" element={<ConfirmationPage />} />
              <Route path="/upravljanje" element={<ManageAppointmentPage />} />
              <Route path="/privatnost" element={<PrivacyPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Toaster
            position="bottom-center"
            closeButton
            toastOptions={{
              duration: 4500,
            }}
          />
        </BrowserRouter>
      </DataProvider>
    </AppErrorBoundary>
  )
}
