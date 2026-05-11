import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppConfigProvider } from './contexts/AppConfigContext'
import { FileProvider } from './contexts/FileContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppConfigProvider>
      <FileProvider>
        <App />
      </FileProvider>
    </AppConfigProvider>
  </StrictMode>,
)
