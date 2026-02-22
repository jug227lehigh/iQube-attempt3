// import { useState } from 'react'
import { Link } from 'react-router-dom'
import constants from '../utilities/constants'
import { createThirdwebClient } from 'thirdweb'
import {
  ConnectButton,
  // useProfiles,÷
  useActiveAccount,
  useSocialProfiles,
} from 'thirdweb/react'

import { inAppWallet } from 'thirdweb/wallets'

const client = createThirdwebClient({
  clientId: '8dc8e3e2452cdf667e0452a5be2906e7',
})

export default function Home() {
  const _account = useActiveAccount()
  const { data: _profiles } = useSocialProfiles({
    client,
    address: _account?.address,
  })
  console.log(_profiles)
  console.log(_account)

  // const [account, setAccount] = useState<string | null>(null)

  const wallets = [
    inAppWallet({
      auth: {
        options: ['google'],
      },
    }),
  ]

  return (
    <div className="center-container bg-[#fff] flex flex-col">
      <h2 className="text-[84px]">WELCOME</h2>
      <div>
        <Link to="/register">META/AMOY</Link>
      </div>
      <p className="my-[60px] text-[20px]">OR</p>
      <ConnectButton
        // onConnect={(wallet) => {
        //   const account: any = wallet.getAccount()
        //   // setAccount(account?.address)
        //   // window.location.href = '/register'
        // }}
        client={client}
        wallets={wallets}
        connectButton={{
          label: 'ThirdWeb',
          style: {
            color: '#000',
            backgroundColor: 'transparent',
          },
        }}
        connectModal={{
          size: 'wide',
          title: 'Sign in',
          termsOfServiceUrl: 'htt',
          privacyPolicyUrl: 'htt',
        }}
        supportedNFTs={{
          11155111: ['0x632E1d32e34F0A690635BBcbec0D066daa448ede'],
          43113: [constants.AVALANCHE],
          80002: [constants.AMOY],
        }}
        chains={[
          {
            rpc: `https://11155111.rpc.thirdweb.com/8dc8e3e2452cdf667e0452a5be2906e7`,
            id: 11155111,
            testnet: true,
            name: 'Sepolia Ethereum',
            nativeCurrency: {
              name: 'Sepolia',
              symbol: 'SepoliaETH',
              decimals: 18,
            },
            blockExplorers: [
              {
                name: 'Sepolia',
                url: 'https://sepolia.etherscan.io',
              },
            ],
          },
          {
            rpc: `https://43113.rpc.thirdweb.com/8dc8e3e2452cdf667e0452a5be2906e7`,
            id: 43113,
            testnet: true,
            name: 'Avalanche Fuji',
            nativeCurrency: {
              name: 'Avalanche',
              symbol: 'AVAX',
              decimals: 18,
            },
            blockExplorers: [
              {
                name: 'Avalanche Fuji',
                url: 'https://testnet.snowtrace.io',
              },
            ],
          },
          {
            rpc: `https://80002.rpc.thirdweb.com/8dc8e3e2452cdf667e0452a5be2906e7`,
            id: 80002,
            testnet: true,
            name: 'Polygon Mumbai',
            nativeCurrency: {
              name: 'Amoy',
              symbol: 'MATIC',
              decimals: 18,
            },
            blockExplorers: [
              {
                name: 'Polygon Amoy',
                url: 'https://www.oklink.com/amoy',
              },
            ],
          },
        ]}
      />
      {_account && (
        <div className="mt-[20px]">
          <Link to="/thirdweb">Thirdweb</Link>
        </div>
      )}
    </div>
  )
}
