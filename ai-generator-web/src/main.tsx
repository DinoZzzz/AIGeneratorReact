import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/animations.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

// Register service worker with automatic updates
const updateSW = registerSW({
  onNeedRefresh() {
    // Automatically refresh when new version is available
    updateSW(true)
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
  // Check for updates immediately and periodically
  immediate: true,
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
