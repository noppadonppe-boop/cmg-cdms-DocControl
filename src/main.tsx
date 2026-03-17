import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

window.addEventListener('error', (e) => {
  console.error('[Global Error]', e.error ?? e.message)
})

window.addEventListener('unhandledrejection', (e) => {
  console.error('[Unhandled Promise]', e.reason)
})

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} catch (err) {
  console.error('[Root render failed]', err)
  const root = document.getElementById('root')!
  root.innerHTML = `
    <div style="font-family:sans-serif;padding:40px;color:#333">
      <h2 style="color:#dc2626">App failed to start</h2>
      <pre style="background:#f3f4f6;padding:16px;border-radius:8px;font-size:13px;overflow:auto">${String(err)}</pre>
      <p style="margin-top:12px;color:#6b7280">Check the browser console (F12) for full details.</p>
    </div>
  `
}
