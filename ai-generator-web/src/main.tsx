import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/animations.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'
import { initSentry } from './lib/sentry'

// Initialize Sentry error tracking (before app renders)
initSentry()

const MODULE_LOAD_RETRY_KEY = 'module-load-retry-at'
const MODULE_LOAD_RETRY_WINDOW_MS = 60_000
const MODULE_LOAD_ERROR_MARKERS = [
  'importing a module script failed',
  'failed to fetch dynamically imported module',
  'error loading dynamically imported module',
]

const readErrorMessage = (value: unknown): string => {
  if (typeof value === 'string') {
    return value
  }
  if (value instanceof Error) {
    return value.message
  }
  if (typeof value === 'object' && value !== null && 'message' in value) {
    const message = (value as { message?: unknown }).message
    return typeof message === 'string' ? message : ''
  }
  return ''
}

const isModuleLoadError = (value: unknown): boolean => {
  const message = readErrorMessage(value).toLowerCase()
  if (!message) return false
  return MODULE_LOAD_ERROR_MARKERS.some((marker) => message.includes(marker))
}

const recoverFromModuleLoadError = (value: unknown): boolean => {
  if (!isModuleLoadError(value)) return false

  const now = Date.now()
  const lastRetryRaw = sessionStorage.getItem(MODULE_LOAD_RETRY_KEY)
  const lastRetry = lastRetryRaw ? Number(lastRetryRaw) : 0

  if (!Number.isFinite(lastRetry) || now - lastRetry > MODULE_LOAD_RETRY_WINDOW_MS) {
    sessionStorage.setItem(MODULE_LOAD_RETRY_KEY, String(now))
    window.location.reload()
  }

  return true
}

const setupModuleLoadRecovery = () => {
  const lastRetryRaw = sessionStorage.getItem(MODULE_LOAD_RETRY_KEY)
  const lastRetry = lastRetryRaw ? Number(lastRetryRaw) : 0
  if (Number.isFinite(lastRetry) && Date.now() - lastRetry > MODULE_LOAD_RETRY_WINDOW_MS) {
    sessionStorage.removeItem(MODULE_LOAD_RETRY_KEY)
  }

  window.addEventListener('vite:preloadError', (event) => {
    const viteEvent = event as Event & { payload?: unknown }
    const recovered = recoverFromModuleLoadError(viteEvent.payload ?? event)
    if (recovered) event.preventDefault()
  })

  window.addEventListener('error', (event) => {
    const errorEvent = event as ErrorEvent
    recoverFromModuleLoadError(errorEvent.error ?? errorEvent.message)
  })

  window.addEventListener('unhandledrejection', (event) => {
    const recovered = recoverFromModuleLoadError(event.reason)
    if (recovered) event.preventDefault()
  })
}

setupModuleLoadRecovery()

// Register service worker with automatic updates
const updateSW = registerSW({
  onNeedRefresh() {
    // Automatically refresh when new version is available
    updateSW(true)
  },
  onOfflineReady() {
    // App is ready to work offline
  },
  // Check for updates immediately and periodically
  immediate: true,
})

const registerBackgroundSync = async () => {
  if (!('serviceWorker' in navigator)) return

  try {
    const registration = await navigator.serviceWorker.ready
    const registrationWithSync = registration as ServiceWorkerRegistration & {
      sync?: { register: (tag: string) => Promise<void> }
    }
    if (!registrationWithSync.sync || typeof registrationWithSync.sync.register !== 'function') {
      return
    }

    await registrationWithSync.sync.register('offline-sync')

    const registrationWithPeriodicSync = registration as ServiceWorkerRegistration & {
      periodicSync?: { register: (tag: string, options: { minInterval: number }) => Promise<void> }
    }
    if (registrationWithPeriodicSync.periodicSync && typeof registrationWithPeriodicSync.periodicSync.register === 'function') {
      await registrationWithPeriodicSync.periodicSync.register('offline-sync-periodic', {
        minInterval: 60 * 60 * 1000, // 1h
      })
    }
  } catch (error) {
    // Background Sync is best-effort and not supported in all browsers.
    console.debug('Background sync registration skipped:', error)
  }
}

const requestServiceWorkerSync = () => {
  if (!('serviceWorker' in navigator)) return
  if (!navigator.serviceWorker.controller) return
  navigator.serviceWorker.controller.postMessage({ type: 'offline-sync-now' })
}

void registerBackgroundSync()
window.addEventListener('online', () => {
  void registerBackgroundSync()
  requestServiceWorkerSync()
})

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    const payload = event.data as { type?: string; success?: number; failed?: number; total?: number } | undefined
    if (payload?.type !== 'offline-sync-result') {
      return
    }

    window.dispatchEvent(new CustomEvent('offline-sync-result', {
      detail: {
        success: payload.success || 0,
        failed: payload.failed || 0,
        total: payload.total || 0,
      },
    }))
  })
}

window.addEventListener('focus', () => {
  requestServiceWorkerSync()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
