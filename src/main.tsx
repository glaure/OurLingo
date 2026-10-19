import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fonts are bundled so the app works offline and makes no requests to font services.
import '@fontsource-variable/dm-sans'
import '@fontsource-variable/fraunces'
import './theme.css'
import App from './OurLingo.tsx'
import { applyTheme, loadSettings } from './settings'

applyTheme(loadSettings().theme)

// The web version (GitHub Pages) keeps working offline and asks the browser
// not to clear the saved progress. The Android app does not need either.
if (import.meta.env.MODE === 'web') {
  navigator.serviceWorker
    ?.register(`${import.meta.env.BASE_URL}sw.js`)
    .catch(() => {})
  navigator.storage?.persist?.().catch(() => false)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
