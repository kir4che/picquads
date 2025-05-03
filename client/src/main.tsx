import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { AlertProvider } from './contexts/AlertContext';
import { CameraProvider } from './contexts/CameraContext';

import App from './App';

import './style.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AlertProvider>
        <CameraProvider>
          <App />
        </CameraProvider>
      </AlertProvider>
    </BrowserRouter>
  </StrictMode>
);
