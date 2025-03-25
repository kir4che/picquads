import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { CameraProvider } from './contexts/CameraContext'

import App from './App'

import './style.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CameraProvider>
      <App />
    </CameraProvider>
  </StrictMode>,
)
