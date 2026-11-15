import '@fontsource-variable/instrument-sans/wght.css'
// The display face: only the optical-size axis, so large sizes get the lighter, more printed
// cut of the serif instead of a blown-up text weight. Latin Extended is bundled, so Ž, š and č
// resolve here rather than falling through to a system serif.
import '@fontsource-variable/fraunces/opsz.css'
import './styles/index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import { startCalendarView } from './features/calendar/useCalendarView'
import { startTheme } from './lib/theme'

// index.html has already put the stored choice on <html> for the first paint; this keeps the
// system preference, other tabs and the switch in Postavke in step from here on.
startTheme()
// The calendar's agenda/grid choice is picked up from another tab the same way.
startCalendarView()

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element is missing')

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
