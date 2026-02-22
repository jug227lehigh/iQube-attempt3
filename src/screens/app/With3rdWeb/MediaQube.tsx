import React, { useState, FormEvent } from 'react'
import { useActiveAccount } from 'thirdweb/react'
import { useMintQube } from '../../../utilities/contractUtils'
import { pinata } from '../../../utilities/pinata-config'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { FileLock, Upload } from 'lucide-react'

interface MetaQubeFields {
  metaQubeIdentifier: string
  metaQubeCreator: string
  entanglementData: string
  recordChangeability: 'Static' | 'Fluid' | 'Mixed'
  ownerType: 'Person' | 'Org' | 'Thing'
  subjectIdentifiability: 'Ident' | 'Semi-Ident' | 'Anon' | 'Semi-Anon'
  accuracyScore: number
  veracityScore: number
  sensitivityScore: number
  intrinsicRiskScore: number
  blakQubeContentType: string
  blakQubeType: 'Restricted' | 'Open'
  metaQubeLocation: string
  transactionDate: string
}

interface MediaQubeProfile {
  metaQube: MetaQubeFields
  blakQube: File | null
}

const MediaQube: React.FC = () => {
  const account = useActiveAccount()
  const [metaQubeLocation, setMetaQubeLocation] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [btnText, setBtnText] = useState('Mint Media Qube')
  const [encryptedURL, setEncryptedURL] = useState('')
  const [isMinted, setIsMinted] = useState(false)
  const [_key, setKey] = useState('')
  const [mediaQubeProfile, setMediaQubeProfile] = useState<MediaQubeProfile>({
    metaQube: {
      metaQubeIdentifier: 'OM KNYT Media Qube Alpha',
      metaQubeCreator: 'Metaiye Media',
      entanglementData: 'Encrypted BlakQube Location in IPFS Hash',
      recordChangeability: 'Static',
      ownerType: 'Person',
      subjectIdentifiability: 'Ident',
      accuracyScore: 0,
      veracityScore: 0,
      sensitivityScore: 0,
      intrinsicRiskScore: 0,
      transactionDate: 'null',
      blakQubeContentType: 'Media File',
      blakQubeType: 'Restricted',
      metaQubeLocation: 'XXXXX',
    },
    blakQube: null,
  })

  const { mintQube, transactionResult } = useMintQube(metaQubeLocation, _key)

  const handleMediaQubeUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (event.target.files && event.target.files[0]) {
      setMediaQubeProfile((prev) => ({
        ...prev,
        blakQube: event.target.files![0],
      }))
    }
  }

  const handleMediaQubeMint = async (e: FormEvent) => {
    e.preventDefault()
    setBtnText('Minting...')
    setIsLoading(true)
    setError('')

    try {
      if (!account) {
        throw new Error('Please connect your thirdweb wallet')
      }

      if (!mediaQubeProfile.blakQube) {
        throw new Error('Please upload a media file')
      }

      // Upload media file to IPFS
      const mediaUpload = await pinata.upload.file(mediaQubeProfile.blakQube)

      // Encrypt the IPFS hash
      const { data } = await axios.post(
        `https://icubes.onrender.com/get-encryption-key`,
        {
          mediaHash: mediaUpload.IpfsHash,
        },
      )

      if (!data.success) {
        throw new Error(data.message || 'Failed to encrypt media hash')
      }

      const { encryptedMediaHash, key } = data.encryptedData
      const updatedMetaData = {
        metaQube: {
          ...mediaQubeProfile.metaQube,
          blakQubeLocation: encryptedMediaHash,
          transactionDate: new Date().toISOString(),
        },
      }

      setKey(key)

      const metadata = JSON.stringify({
        name: `Media iQube NFT #${Date.now()}`,
        description: 'An encrypted Media iQube NFT',
        image: '', // You might want to add a placeholder image or icon for media
        attributes: Object.entries(updatedMetaData.metaQube).map(
          ([key, value]) => ({
            trait_type: key,
            value: value,
          }),
        ),
      })

      const metadataUpload = await pinata.upload.json(JSON.parse(metadata))
      const url = `${import.meta.env.VITE_GATEWAY_URL}/ipfs/${
        metadataUpload.IpfsHash
      }`

      setMetaQubeLocation(url)
      setEncryptedURL(url)

      mintQube()
      setIsMinted(true)
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to mint Media NFT',
      )
      console.error('Minting error:', error)
    } finally {
      setBtnText('Mint Media Qube')
      setIsLoading(false)
    }
  }

  return (
    <div className="p-[100px]">
      <div className="flex justify-between">
        <h1 className="font-bold text-[23px]">Create Media Qube.</h1>
        <Link
          to="/thirdweb/decryptmedia"
          className="bg-[#000] text-[#fff] px-[20px] py-[25px] rounded-[5px] flex items-center gap-2"
        >
          <FileLock size={15} /> Decrypt a Media Qube
        </Link>
      </div>
      <form className="flex flex-col" onSubmit={handleMediaQubeMint}>
        <div className="flex flex-wrap w-full mb-4">
          {Object.entries(mediaQubeProfile.metaQube).map(([key, value]) => (
            <MetadataInput
              key={key}
              field={key}
              value={value}
              onChange={(newValue) =>
                setMediaQubeProfile((prev) => ({
                  ...prev,
                  metaQube: { ...prev.metaQube, [key]: newValue },
                }))
              }
              disabled={isLoading}
            />
          ))}
        </div>
        <div className="mb-4">
          <label className="block text-[12px] mb-2">Upload Media File:</label>
          <input
            type="file"
            onChange={handleMediaQubeUpload}
            disabled={isLoading}
            required
            className="w-full border-[blue] p-2"
          />
        </div>
        <button
          className="bg-blue-500 text-white px-[10px] py-[5px] rounded-[5px] w-[160px] flex items-center justify-center"
          disabled={isLoading}
        >
          <Upload size={15} className="mr-2" />
          {btnText} ...
        </button>
      </form>
      {isMinted && (
        <p className="text-[10px] text-green-500 mt-2">
          Media Qube minted successfully ...
        </p>
      )}
      <p className="text-[10px] mt-2">
        {encryptedURL && (
          <Link to={encryptedURL} className="text-[10px]">
            MetaData Generated Successfully:{' '}
            <span className="text-underline text-blue-500">View Meta</span>
          </Link>
        )}
      </p>
      {error && <ErrorDisplay error={error} />}
      {transactionResult && (
        <p className="text-[10px] flex mt-2">
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
    </div>
  )
}

export default MediaQube

const ErrorDisplay: React.FC<{ error: string }> = ({ error }) => (
  <div className="border border-red-500 rounded-[5px] mb-[25px] w-full flex items-center justify-center h-[63px]">
    <p style={{ color: 'red' }}>{error}</p>
  </div>
)

const MetadataInput: React.FC<{
  field: string
  value: string | number
  onChange: (value: string | number) => void
  disabled: boolean
}> = ({ field, value, onChange, disabled }) => (
  <div className="w-1/3 mb-2">
    <label className="block text-[7px]">{field}: </label>
    <input
      type={typeof value === 'number' ? 'number' : 'text'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      required
      className="w-[95%] border-[blue] p-1"
    />
  </div>
)
