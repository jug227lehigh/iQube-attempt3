import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { WalletProvider } from './context/WalletContext'

import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import CreateIQubeWizard from './screens/app/CreateIQubeWizard.tsx'
import DecryptQube from './screens/app/DecryptQube.tsx'
import TransferQube from './screens/app/TransferQube.tsx'
import MyIQubes from './screens/app/MyIQubes.tsx'
import Registry from './screens/app/Registry.tsx'

const router = createBrowserRouter([
  { path: '/', element: <CreateIQubeWizard /> },
  { path: '/my-iqubes', element: <MyIQubes /> },
  { path: '/decrypt', element: <DecryptQube /> },
  { path: '/transfer', element: <TransferQube /> },
  { path: '/registry', element: <Registry /> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <WalletProvider>
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  </WalletProvider>,
)
