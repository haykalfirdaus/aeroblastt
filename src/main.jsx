import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'aos/dist/aos.css'
import './index.css'
import App from './App.jsx'
import { initDevtoolsProtection } from './utils/devtools-protection.js'

initDevtoolsProtection()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
