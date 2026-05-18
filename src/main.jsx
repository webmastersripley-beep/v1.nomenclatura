import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from "sonner"
import "react-datepicker/dist/react-datepicker.css"
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
      <Toaster
        position="bottom-right"
        richColors
      />
  </StrictMode>,
)
