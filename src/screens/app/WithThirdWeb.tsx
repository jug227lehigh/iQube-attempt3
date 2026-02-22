import { useState, useEffect } from 'react'
import { useActiveAccount } from 'thirdweb/react'
import { Link } from 'react-router-dom'
import {
  useMetaQubeLocation,
  useMintQube,
  useGetEncryptionKey,
  ownerOf,
} from '../../utilities/contractUtils'
import PolygonNFTInterface from '../../utilities/MetaContract'
import { ABI } from '../../utilities/ABI'

export default function WithThirdWebClient() {
  const _account = useActiveAccount()
  // const [isSubmitted, setIsSubmitted] = useState(false)
  const [tokenId, setTokenId] = useState<any>(0)
  const [metaQubeLocation, setMetaQubeLocation] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    data: metaQubeLocationData,
    isLoading: metaQubeLocationLoading,
  } = useMetaQubeLocation(tokenId)

  useEffect(() => {
    if (metaQubeLocationData) {
      // console.log('metaQubeLocationData', metaQubeLocationData)
      setMetaQubeLocation(metaQubeLocationData)
    } else {
      setMetaQubeLocation('')
    }
    setIsLoading(metaQubeLocationLoading)
  }, [metaQubeLocationData, metaQubeLocationLoading])

  const handleSubmit = (event: any) => {
    event.preventDefault()
    // setIsSubmitted(true)
  }

  const { mintQube, transactionResult } = useMintQube(_account, '')
  const getEncryptionKey = useGetEncryptionKey(tokenId)
  console.log('getEncryptionKey', getEncryptionKey)

  const owner = ownerOf(tokenId)
  console.log('owner', owner?.data)

  const getEncKey = async () => {
    try {
      const encKey = new PolygonNFTInterface(
        '0x031868250e6295f5174ca0Cbe86527750f02eCAd',
        ABI,
      )
      const owner = await encKey.ownerOf(tokenId)
      console.log('owner', owner)
      const key = await encKey.getEncryptionKey(tokenId)
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
          <button onClick={mintQube}>Mint Qube.</button>
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
