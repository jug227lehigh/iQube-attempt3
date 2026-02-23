import React, { useState, FormEvent } from 'react'
import { useWallet } from '../../../context/WalletContext'
import { useMintQube } from '../../../hooks/contractHooks'
import { pinata } from '../../../utilities/pinata-config'
import axios from 'axios'
import { Upload } from 'lucide-react'

interface MetadataFields {
  metaQubeIdentifier: string
  metaQubeCreator?: string
  iQubeSchema?: string
  iQubeKey?: string
  metaQubeLocation?: string
  recordChangeability: 'Static' | 'Fluid' | 'Mixed'
  ownerType: 'Person' | 'Org' | 'Thing'
  subjectIdentifiability: 'Ident' | 'Semi-Ident' | 'Anon' | 'Semi-Anon'
  accuracyScore: number
  veracityScore: number
  sensitivityScore: number
  intrinsicRiskScore: number
  transactionDate?: string
  blakQubeIdentifier?: string
  blakQubeLocation?: string
  blakQubeKey?: string
  blakQubeType: 'Restricted' | 'Open'
}

const ContentQube: React.FC = () => {
  const { address } = useWallet()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [metadataFields, setMetadataFields] = useState<MetadataFields>({
    metaQubeIdentifier: '',
    recordChangeability: 'Static',
    ownerType: 'Person',
    subjectIdentifiability: 'Ident',
    accuracyScore: 5,
    veracityScore: 5,
    sensitivityScore: 5,
    intrinsicRiskScore: 5,
    blakQubeType: 'Restricted',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [btnText, setBtnText] = useState('Mint Content Qube')
  const [encryptedURL, setEncryptedURL] = useState('')
  const [isMinted, setIsMinted] = useState(false)

  const [key, setKey] = useState('')

  const { mintQube, transactionResult } = useMintQube(encryptedURL, key)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0])
    }
  }

  const handleMetadataChange = (
    field: keyof MetadataFields,
    value: string | number,
  ) => {
    setMetadataFields((prev) => ({ ...prev, [field]: value }))
  }

  const handleMint = async (e: FormEvent) => {
    e.preventDefault()
    // Account check removed for testing
    if (!selectedFile) {
      setError('Please select a file')
      return
    }

    setBtnText('Minting...')
    setIsLoading(true)
    setError('')

    try {
      // Upload file to IPFS via Pinata
      const upload = await pinata.upload.file(selectedFile)

      // Get Enc data
      const { data: encryptionData } = await axios.post(
        'https://icubes.onrender.com/get-encryption-key',
        {
          uri: upload.IpfsHash,
        },
      )

      if (!encryptionData.success) {
        throw new Error('Failed to encrypt data')
      }

      setKey(encryptionData.key)
      console.log(encryptionData.key)
      // Update metadata fields
      const updatedMetadataFields: MetadataFields = {
        ...metadataFields,
        iQubeKey: `iQube-${Date.now()}`,
        transactionDate: new Date().toISOString(),
        blakQubeKey: encryptionData.data,
        blakQubeLocation: encryptionData.data,
        blakQubeIdentifier: `iQube-${Date.now()}`,
        metaQubeCreator: address ?? '',
      }

      // Create and upload metadata
      const metadata = JSON.stringify({
        name: `Content iQube NFT #${Date.now()}`,
        description: 'An encrypted Content iQube NFT',
        image: encryptionData.data,
        attributes: [
          { trait_type: 'Encrypted', value: 'True' },
          ...Object.entries(updatedMetadataFields).map(([key, value]) => ({
            trait_type: key,
            value: value,
          })),
        ],
      })

      const metadataUpload = await pinata.upload.json(JSON.parse(metadata))
      const url = `${import.meta.env.VITE_GATEWAY_URL}/ipfs/${
        metadataUpload.IpfsHash
      }`

      setEncryptedURL(url)
      setMetadataFields(updatedMetadataFields)

      // Mint NFT
      await mintQube(url, encryptionData.key)
      setIsMinted(true)
      console.log(transactionResult)
    } catch (error) {
      console.error('Error minting NFT:', error)
      setError('Failed to mint NFT. Please check console for details.')
    } finally {
      setBtnText('Mint Content Qube')
      setIsLoading(false)
    }
  }

  return (
    <div className="center-container">
      <div className="w-[40%] bg-[#fff] rounded-[10px] p-[40px] border border-black">
        <div className="flex justify-between items-center">
          <h2 className="text-underline font-bold text-[16px]">
            Mint Content Qube
          </h2>
        </div>
        <p className="text-[12px] mb-[20px]">
          Mint a Content Qube to store your data on the blockchain.
        </p>
        <form onSubmit={handleMint}>
          <label htmlFor="file" className="mb-[5px] text-[11px]">
            Upload File
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            className="mb-[20px]"
          />
          <div className="flex flex-wrap">
            {Object.entries(metadataFields).map(([key, value]) => (
              <div key={key} className="w-[33%]">
                <label className="block text-[10px]">{key}: </label>
                <input
                  type={typeof value === 'number' ? 'number' : 'text'}
                  value={value}
                  onChange={(e) =>
                    handleMetadataChange(
                      key as keyof MetadataFields,
                      e.target.value,
                    )
                  }
                  disabled={isLoading}
                  required
                  className="w-[95%] border-[blue]"
                />
              </div>
            ))}
          </div>
          <button
            className="bg-blue-500 text-white text-[14px] px-[14px] py-[20px] rounded-[5px] mt-[30px] flex items-center justify-center"
            disabled={isLoading}
          >
            <Upload size={15} className="mr-2" />
            {btnText}..
          </button>
        </form>
        {isMinted && (
          <p className="text-[14px] text-green-500 mt-2 text-center">
            Content Qube minted successfully
          </p>
        )}
        {error && <ErrorDisplay error={error} />}
        {transactionResult && (
          <p className="text-[14px] flex mt-2">
            To View Tx =
            <a
              href={`https://www.oklink.com/amoy/tx/${transactionResult?.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 ml-1"
            >
              Click Here
            </a>
          </p>
        )}

        <hr className="w-[50%] my-[50px]" />
        <h4 className="text-[14px]">Retrieve Metadata</h4>
        <form>
          <input type="text" placeholder="Token ID" />
          <button>Get Metadata</button>
        </form>
      </div>
    </div>
  )
}

export default ContentQube

const ErrorDisplay: React.FC<{ error: string }> = ({ error }) => (
  <div className="border border-red-500 rounded-[5px] mb-[25px] w-full flex items-center justify-center h-[63px]">
    <p style={{ color: 'red' }}>{error}</p>
  </div>
)
