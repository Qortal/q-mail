import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { HashRouter, BrowserRouter } from 'react-router-dom'
import { GlobalContextMenu } from './components/common/GlobalContextMenu/GlobalContextMenu'

if (typeof global === 'undefined') {
  // Check if window is defined to avoid issues in non-browser environments
  if (typeof window !== 'undefined') {
    ;(window as any).global = window
  }
}
interface CustomWindow extends Window {
  _qdnBase: any // Replace 'any' with the appropriate type if you know it
}

const customWindow = window as unknown as CustomWindow



// Now you can access the _qdnTheme property without TypeScript errors
const baseUrl = customWindow?._qdnBase || ''
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <BrowserRouter basename={baseUrl}>
    <App />
    <GlobalContextMenu />
    <div id="modal-root" />
  </BrowserRouter>
)
