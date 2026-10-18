import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fonts are bundled so the app works offline and makes no requests to font services.
import '@fontsource-variable/dm-sans'
import '@fontsource-variable/fraunces'
import './theme.css'
import App from './OurLingo.tsx'
import { applyTheme, loadSettings } from './settings'

applyTheme(loadSettings().theme)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
