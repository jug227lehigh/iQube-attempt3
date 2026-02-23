import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { WalletProvider } from './context/WalletContext'

import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import CreateIQubeWizard from './screens/app/CreateIQubeWizard.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <CreateIQubeWizard />,
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <WalletProvider>
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  </WalletProvider>,
)
