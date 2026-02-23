import { useState } from 'react'
import axios from 'axios'
import { useWallet } from '../../../context/WalletContext'
import {
  useMetaQubeLocation,
  useGetEncryptionKeyII,
  useOwnerOf,
} from '../../../hooks/contractHooks'

export default function DecryptData() {
  const [tokenId, setTokenId] = useState('')
  const [decryptedData, setDecryptedData] = useState('')
  const [btnText, setBtnText] = useState('Decrypt')
  const [error, setError] = useState('')
  const { address: publicKeyAddress } = useWallet()

  const { data: ownerData, isLoading: isOwnerLoading } = useOwnerOf(tokenId)
  const { _encryptionKey, encKeyIsLoading, encKeyError } =
    useGetEncryptionKeyII(tokenId) ?? {}
  const { data: location, isLoading: isLocationLoading } = useMetaQubeLocation(
    tokenId,
  )

  const onDecrypt = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBtnText('Decrypting...')
    setError('')
    try {
      if (publicKeyAddress !== ownerData) {
        throw new Error('You are not the owner of this Qube.')
      }
      if (!_encryptionKey) {
        throw new Error('Encryption key not found.')
      }

      const response = await axios.post('/api/decrypt', {
        tokenId,
        encryptionKey: _encryptionKey,
      })
      setDecryptedData(response.data)
    } catch (error) {
      console.error('Error decrypting data:', error)
      if (error instanceof Error) {
        setError(error.message)
      }
    } finally {
      setBtnText('Decrypt')
    }
  }

  return (
    <div className="center-container">
      <div className="w-[40%] bg-[#fff]  rounded-[10px] p-[40px] border border-black">
        <h2 className="text-underline font-bold text-[20px]">Decrypt Token</h2>
        <p className="text-[17px] text-gray-500 mb-[20px]">
          Decrypt your data with your private key.
        </p>
        <form onSubmit={onDecrypt}>
          <input
            type="text"
            placeholder="Enter your token id"
            className="h-[60px] rounded-[10px] w-full px-[34px]"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
          />
          <button
            type="submit"
            disabled={isOwnerLoading || encKeyIsLoading || isLocationLoading}
          >
            {btnText}
          </button>
        </form>

        {tokenId && !isLocationLoading && location !== null && (
          <p className="text-[13px] text-gray-500 my-[20px] text-center">
            QubeLocation:{' '}
            <a
              href={location}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500"
            >
              Here
            </a>
          </p>
        )}

        {decryptedData && (
          <div className="mt-[20px]">
            <h3 className="font-bold">Decrypted Data:</h3>
            <pre className="bg-gray-100 p-2 rounded">{decryptedData}</pre>
          </div>
        )}

        {encKeyError && (
          <p className="text-red-500 mt-[10px] text-[12px] text-center">
            Error: {encKeyError?.message ?? String(encKeyError)}
          </p>
        )}

        {error && (
          <p className="text-red-500 mt-[10px] text-[12px] text-center">
            Error: {error}
          </p>
        )}
      </div>
    </div>
  )
}
