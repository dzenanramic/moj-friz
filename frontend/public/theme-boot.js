/*
 * First-paint theme. Runs before the app module (index.html) and only applies the stored choice
 * (`mojfriz.theme`, written by the switch in Postavke). With nothing stored it leaves the page to
 * prefers-color-scheme, which index.css already handles; it only reports that state.
 */
const STORAGE_KEY = 'mojfriz.theme'
const root = document.documentElement

let stored = null
try {
  stored = window.localStorage.getItem(STORAGE_KEY)
} catch {
  stored = null
}

if (stored === 'dark') {
  root.classList.remove('light')
  root.classList.add('dark', 'stored-dark')
} else if (stored === 'light') {
  root.classList.remove('dark')
  root.classList.add('light', 'stored-light')
} else {
  root.classList.add('stored-system')
}
