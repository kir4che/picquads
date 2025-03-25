import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { ErrorProvider } from './contexts/ErrorContext'
import { CameraProvider } from './contexts/CameraContext'

import App from './App'

import './style.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorProvider>
      <CameraProvider>
        <App />
      </CameraProvider>
    </ErrorProvider>
  </StrictMode>,
)
