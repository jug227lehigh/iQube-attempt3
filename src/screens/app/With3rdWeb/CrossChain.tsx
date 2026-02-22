import { useState } from 'react'
import { ArrowUpDown } from 'lucide-react'
export default function CrossChain() {
  const [fromChain, setFromChain] = useState('Polygon-Amoy')
  const [toChain, setToChain] = useState('Avalanche-Fuji')
  const [tokenId, setTokenId] = useState('')
  const [walletAddress, setWalletAddress] = useState('')

  const handleSwap = () => {
    setFromChain(toChain)
    setToChain(fromChain)
  }

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual cross-chain transfer logic
    console.log('Transfer Details:', {
      fromChain,
      toChain,
      tokenId,
      walletAddress
    });
    // Additional transfer logic would go here
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 text-center py-3">
            Cross-Chain Transfer
          </h2>
          <form onSubmit={handleTransfer} className="space-y-4 p-4 bg-white rounded-lg shadow-md">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-md"
                value={fromChain}
                onChange={(e) => setFromChain(e.target.value)}
              >
                <option value="Avalanche-Fuji">Avalanche (Fuji)</option>
                <option value="Arbitrum-Sepolia">Arbitrum (Sepolia)</option>
                <option value="Aurora-Sepolia">Aurora (Sepolia)</option>
                <option value="Polygon-Amoy">Polygon PoS (Amoy)</option>
                <option value="Polygon-zkEVM-Cardona">Polygon zkEVM (Cardona)</option>
              </select>
            </div>
            <div className="flex justify-center my-4">
              <div className="bg-[#f6f6f6] h-[50px] w-[50px] rounded-[10px] flex items-center justify-center">
                <ArrowUpDown
                  color="grey"
                  onClick={handleSwap}
                  className="cursor-pointer"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-md"
                value={toChain}
                onChange={(e) => setToChain(e.target.value)}
              >
                <option value="Avalanche-Fuji">Avalanche (Fuji)</option>
                <option value="Arbitrum-Sepolia">Arbitrum (Sepolia)</option>
                <option value="Aurora-Sepolia">Aurora (Sepolia)</option>
                <option value="Polygon-Amoy">Polygon PoS (Amoy)</option>
                <option value="Polygon-zkEVM-Cardona">Polygon zkEVM (Cardona)</option>
              </select>
            </div>
            <div className="flex justify-center">
              <hr className="w-[50%] my-[20px] border-[#f6f6f6]" />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wallet Address
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-md"
                placeholder="Enter Wallet Address"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                iQube ID
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-md"
                placeholder="Enter iQube ID"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 transition duration-300"
            >
              Transfer
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
