import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Providers } from './app/providers'
import './index.css'
import App from './App.jsx'

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Service worker registration failed:', err)
      })
    })
  } else {
    // Prevent stale caches from affecting local development behavior.
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister()
      })
    })
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>,
)
