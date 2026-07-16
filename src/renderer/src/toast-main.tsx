import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CaptureToastApp } from '@/components/ui/capture-toast-app'
import './assets/main.css'

document.documentElement.classList.add('capture-toast-root')
document.body.classList.add('capture-toast-root')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CaptureToastApp />
  </StrictMode>
)
