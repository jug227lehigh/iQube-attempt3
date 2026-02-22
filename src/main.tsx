import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { ThirdwebProvider } from 'thirdweb/react'

import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Login from './screens/auth/Login.tsx'
import Home from './screens/Home.tsx'
import Signup from './screens/auth/Register.tsx'
import Dashboard from './screens/app/Dashboard.tsx'
import IQubeNFTMinter from './screens/app/NftMinter.tsx'
import AvalancheMinter from './screens/app/AvalancheMinter.tsx'
import WithThirdWebClient from './screens/app/WithThirdWeb.tsx'
import WithMetamask from './screens/metamask/WithMetamask.tsx'
import ProviderHandle from './screens/auth/ProviderHandle.tsx'
import Sidebar from './layout/Sidebar.tsx'
import DataQube from './screens/app/With3rdWeb/DataQube.tsx'
import TransferQube from './screens/app/With3rdWeb/TransferQube.tsx'
import ContentQube from './screens/app/With3rdWeb/ContentQube.tsx'
import DecryptData from './screens/app/With3rdWeb/DecryptData.tsx'
import Agent from './screens/app/With3rdWeb/Agent.tsx'
import CrossChain from './screens/app/With3rdWeb/CrossChain.tsx'
const router = createBrowserRouter([
  {
    path: '/',
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Signup /> },
      { path: 'create-handle', element: <ProviderHandle /> },
    ],
  },
  {
    path: '/dashboard',
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'minter', element: <IQubeNFTMinter /> },
      { path: 'avalanche', element: <AvalancheMinter /> },
      { path: 'thirdweb', element: <WithThirdWebClient /> },
      { path: 'metamask', element: <WithMetamask /> },
    ],
  },
  {
    path: '/thirdweb',
    element: <Sidebar />,
    children: [
      { index: true, element: <DataQube /> },
      { path: 'dataqube', element: <DataQube /> },
      { path: 'avalanche', element: <DataQube /> },
      { path: 'thirdweb', element: <DataQube /> },
      { path: 'transfer', element: <TransferQube /> },
      { path: 'contentqube', element: <ContentQube /> },
      { path: 'decryptdata', element: <DecryptData /> },
      { path: 'agent', element: <Agent /> },
      { path: 'crosschain', element: <CrossChain /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThirdwebProvider>
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  </ThirdwebProvider>,
)
