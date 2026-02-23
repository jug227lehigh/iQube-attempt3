import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  useMetaQubeLocation,
  useMintQube,
  useOwnerOf,
} from '../../hooks/contractHooks'
import PolygonNFTInterface from '../../utilities/MetaContract'
import { ABI } from '../../utilities/ABI'

export default function WithThirdWebClient() {
  const [tokenId, setTokenId] = useState<string | number>(0)
  const [metaQubeLocation, setMetaQubeLocation] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    data: metaQubeLocationData,
    isLoading: metaQubeLocationLoading,
  } = useMetaQubeLocation(tokenId)

  useEffect(() => {
    if (metaQubeLocationData) {
      setMetaQubeLocation(metaQubeLocationData)
    } else {
      setMetaQubeLocation('')
    }
    setIsLoading(metaQubeLocationLoading)
  }, [metaQubeLocationData, metaQubeLocationLoading])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
  }

  const { mintQube, transactionResult } = useMintQube(metaQubeLocation ?? '', '')
  useOwnerOf(tokenId)

  const getEncKey = async () => {
    try {
      const encKey = new PolygonNFTInterface(
        '0x031868250e6295f5174ca0Cbe86527750f02eCAd',
        ABI,
      )
      const tokenIdStr = String(tokenId)
      const owner = await encKey.ownerOf(tokenIdStr)
      console.log('owner', owner)
      const key = await encKey.getEncryptionKey(tokenIdStr)
      console.log('key', key)
    } catch (error) {
      console.log('error', error)
    }
  }
  return (
    <>
      <div className="p-[100px]">
        <h1>With ThirdWeb</h1>
        <div className="w-[30%]">
          <form onSubmit={handleSubmit}>
            <label htmlFor="" className="">
              Verify Token Metadata
            </label>
            <hr className="py-[10px]" />
            <input
              type="text"
              placeholder="Token ID"
              onChange={(e) => setTokenId(e.target.value)}
              value={tokenId}
            />
            <button>Get Token URI</button>

            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <Link to={metaQubeLocation || ''}>View Metadata</Link>
            )}
          </form>

          <hr className="my-[10px]" />
          <button type="button" onClick={() => mintQube()}>Mint Qube.</button>
          <p className="text-[black] text-[12px]">
            transactionResult: {transactionResult?.transactionHash}
          </p>
          <hr className="my-[10px]" />
          <button onClick={getEncKey}>Get Encryption Key</button>
        </div>
      </div>
    </>
  )
}
