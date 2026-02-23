import { useState, FormEvent } from 'react'
import type { Address } from 'viem'
import { useTransferQube } from '../../../hooks/contractHooks'

const TransferQube = () => {
  const [recipient, setRecipient] = useState('')
  const [tokenId, setTokenId] = useState('')
  const [isTransferring, setIsTransferring] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const toAddress = recipient.trim() ? (recipient as Address) : null
  const { transfer, transactionError } = useTransferQube(tokenId, toAddress)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!toAddress || !transfer) return
    setIsTransferring(true)
    setSuccessMessage('')
    try {
      await transfer()
      setSuccessMessage(
        `Successfully transferred Qube ${tokenId} to ${recipient}`,
      )
      setRecipient('')
    } catch (error) {
      console.error('Transfer error:', error)
    } finally {
      setIsTransferring(false)
    }
  }

  return (
    <div className="p-12 flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Transfer Qube</h1>
      <p className="text-base max-w-md mb-8 text-center">
        Transfer your Qube to another user's address or Knyt handle.
      </p>
      <form className="w-full max-w-md" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Recipient's address or @knyt handle"
          className="w-full p-3 rounded border border-gray-300 mb-4"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
        <input
          type="text"
          placeholder="Token ID"
          className="w-full p-3 rounded border border-gray-300 mb-4"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
        />
        <button
          className="w-full bg-blue-500 text-white p-3 rounded disabled:opacity-50"
          disabled={isTransferring}
        >
          {isTransferring ? 'Transferring...' : 'Transfer Qube'}
        </button>
        {successMessage && (
          <p className="text-green-500 mt-2">{successMessage}</p>
        )}
        {transactionError && (
          <p className="text-red-500 mt-2">{transactionError.message}</p>
        )}
      </form>
    </div>
  )
}

export default TransferQube
