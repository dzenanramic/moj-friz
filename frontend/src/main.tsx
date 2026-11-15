import '@fontsource-variable/instrument-sans/wght.css'
import './styles/index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import { startTheme } from './lib/theme'

// index.html has already put the stored choice on <html> for the first paint; this keeps the
// system preference, other tabs and the switch in Postavke in step from here on.
startTheme()

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element is missing')

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
