import { useWallet } from '../context/WalletContext'

export default function WalletConnect() {
  const { address, isConnecting, connect, disconnect } = useWallet()

  if (address) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 truncate max-w-[140px]" title={address}>
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
        <button
          type="button"
          onClick={disconnect}
          className="text-black underline text-sm hover:no-underline"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={connect}
      disabled={isConnecting}
      className="text-black underline hover:no-underline disabled:opacity-50"
    >
      {isConnecting ? 'Connecting…' : 'Connect wallet'}
    </button>
  )
}
