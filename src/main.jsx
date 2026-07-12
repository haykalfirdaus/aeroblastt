import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initDevtoolsProtection } from './utils/devtools-protection.js'

// AOS CSS only needed on tablet/desktop — skip on mobile to reduce render-blocking CSS
if (typeof window !== 'undefined' && window.innerWidth >= 768) {
  import('aos/dist/aos.css')
}

initDevtoolsProtection()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
