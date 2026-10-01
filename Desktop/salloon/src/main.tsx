import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { SalonProvider } from './store/SalonContext'
import { ThemeProvider } from './store/theme'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <SalonProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </SalonProvider>
    </ThemeProvider>
  </StrictMode>,
)
