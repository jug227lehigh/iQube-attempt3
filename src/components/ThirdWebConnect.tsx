// import { useState } from 'react'
import constants from '../utilities/constants'
import { createThirdwebClient } from 'thirdweb'
import {
  ConnectButton,
  useActiveAccount,
  useSocialProfiles,
} from 'thirdweb/react'

import { inAppWallet } from 'thirdweb/wallets'

const client = createThirdwebClient({
  clientId: '8dc8e3e2452cdf667e0452a5be2906e7',
})

export default function ThirdWebConnect() {
  const _account = useActiveAccount()
  const { data: _profiles } = useSocialProfiles({
    client,
    address: _account?.address,
  })

  // const [account, setAccount] = useState<string | undefined>(undefined)
  const wallets = [
    inAppWallet({
      auth: {
        options: ['google'],
      },
    }),
  ]
  return (
    <ConnectButton
      // onConnect={(wallet) => {
      //   const account: any = wallet.getAccount()
      //   setAccount(account?.address)
      //   // window.location.href = '/register'
      // }}
      client={client}
      wallets={wallets}
      connectButton={{
        label: 'Connect ThirdWeb',
        style: {
          color: '#000',
          backgroundColor: 'transparent',
          textDecoration: 'underline',
        },
      }}
      connectModal={{
        size: 'wide',
        title: 'Sign in',
        termsOfServiceUrl: 'htt',
        privacyPolicyUrl: 'htt',
      }}
      supportedNFTs={{
        11155111: ['0x9FDbDa9040e9334bC31086562ED31f55E60be175'],
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
  )
}
