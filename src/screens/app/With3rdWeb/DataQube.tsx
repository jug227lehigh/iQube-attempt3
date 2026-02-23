import React, { useState, FormEvent } from 'react'
import { useWallet } from '../../../context/WalletContext'
import { useMintQube } from '../../../hooks/contractHooks'
import { pinata } from '../../../utilities/pinata-config'
import axios from 'axios'
import { Link } from 'react-router-dom'
// import { FileLock } from 'lucide-react'

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

interface BlakQubeFields {
  firstName: string
  lastName: string
  fioHandle: string
  email: string
  phoneNumber: string
  generation: string
  address: string
  metaiyeShares: number
  kyntCoinOwned: number
  omMemberSince: number
  omTierStatus: string
  ethPublicKey: string
  polygonPublicKey: string
  thirdWebPublicKey: string
  metaMaskWalletAddress: string
  otherWalletAddresses: string[]
  metaKeepPublicKey: string
  twitterHandle: string
  instagramHandle: string
  facebookId: string
  tikTokHandle: string
  linkedInId: string
  discordHandle: string
  telegramHandle: string
  knytMotionComicsOwned: string[]
  knytPrintComicsOwned: string[]
  knytPdfComicsOwned: string[]
  knytPostersOwned: string[]
  knytCardsOwned: string[]
  knytCharactersOwned: string[]
}

interface MemberProfile {
  metaQube: MetaQubeFields
  blakQube?: BlakQubeFields
}

const DataQube: React.FC = () => {
  const { address } = useWallet()
  const [metaQubeLocation, setMetaQubeLocation] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [btnText, setBtnText] = useState('Mint Qube')
  const [encryptedURL, setEncryptedURL] = useState('')
  const [isMinted, setIsMinted] = useState(false)
  const [_key, setKey] = useState('')
  const [memberProfile, setMemberProfile] = useState<MemberProfile>({
    metaQube: {
      metaQubeIdentifier: 'OM KNYT Qube Alpha',
      metaQubeCreator: 'Metaiye Media',
      entanglementData: 'Encrypted BlakQube Location in IPFS Hash',
      recordChangeability: 'Mixed',
      ownerType: 'Person',
      subjectIdentifiability: 'Ident',
      accuracyScore: 0,
      veracityScore: 0,
      sensitivityScore: 0,
      intrinsicRiskScore: 0,
      transactionDate: 'null',
      blakQubeContentType: 'Information Records',
      blakQubeType: 'Restricted',
      metaQubeLocation: 'XXXXX',
    },
    blakQube: {
      firstName: 'Dele',
      lastName: 'Atanda',
      fioHandle: 'Qrypto@KNYT',
      email: 'info@metame.com',
      phoneNumber: '787 888 8888',
      generation: 'X',
      address: '23 My home',
      metaiyeShares: 439,
      kyntCoinOwned: 3000,
      omMemberSince: 2019,
      omTierStatus: 'ZeroKnyt',
      ethPublicKey: 'arkagent.eth',
      polygonPublicKey: 'arkagent.eth',
      thirdWebPublicKey: 'oX34355464656465',
      metaMaskWalletAddress: 'qrypto@knyt',
      otherWalletAddresses: ['qrypto@knyt', 'arkagent.eth'],
      metaKeepPublicKey: 'info@metame.com',
      twitterHandle: 'www.x.com/Arkagent',
      instagramHandle: 'www.instagram.com/arkagent',
      facebookId: 'www.facebook.com/deleatanda',
      tikTokHandle: 'www.titktok.com/arkagent',
      linkedInId: 'www.linlind.com/in/dedleatanda',
      discordHandle: 'QryptoKnyt',
      telegramHandle: 'QryptoKnyt',
      knytMotionComicsOwned: [
        '#0E',
        '#1R',
        '#2L',
        '#3E',
        '#5E',
        '#6L',
        '#8R',
        '#9E',
        '#10L',
        '#11E',
        '#12E',
      ],
      knytPrintComicsOwned: [
        '#0',
        '#1',
        '#2',
        '#3',
        '#4',
        '#5',
        '#6',
        '#7',
        '#8',
        '#9',
        '#10',
        '#11',
        '#12',
      ],
      knytPdfComicsOwned: [
        '#0E',
        '#1R',
        '#2L',
        '#3E',
        '#5E',
        '#6L',
        '#8R',
        '#9E',
        '#10L',
        '#11E',
        '#12E',
      ],
      knytPostersOwned: [
        '#0',
        '#1',
        '#2',
        '#3',
        '#4',
        '#5',
        '#6',
        '#7',
        '#8',
        '#9',
        '#10',
        '#11',
        '#12',
      ],
      knytCardsOwned: ['#0', '#1', '#2', '#3'],
      knytCharactersOwned: ['Emmissary#18', 'Deji#2'],
    },
  })

  const { mintQube, transactionResult } = useMintQube(metaQubeLocation, _key)

  const handleMemberProfileMint = async (e: FormEvent) => {
    e.preventDefault()
    setBtnText('Minting...')
    setIsLoading(true)
    setError('')

    try {
      if (!address) {
        throw new Error('Please connect your wallet')
      }

      let blakQube: string
      let key: string

      try {
        const { data } = await axios.post(
          `https://iqubes-server.onrender.com/encrypt-member-qube`,
          memberProfile.blakQube,
        )

        if (!data.success) {
          throw new Error(data.message || 'Failed to encrypt BlakQube')
        }

        const enc = data.encryptedData
        blakQube = enc.encryptedBlakQube
        key = enc.key
      } catch (backendErr: unknown) {
        const msg = backendErr instanceof Error ? backendErr.message : String(backendErr)
        if (msg.includes('FORBIDDEN') || msg.includes('plan usage limit')) {
          setError(
            'Encryption server is over its plan limit (it uses Thirdweb). Ask your backend team to fix iqubes-server.onrender.com, or use "Test mint (no encryption)" below to try the on-chain mint only.'
          )
          return
        }
        throw backendErr
      }

      setKey(key)

      const updatedMetaData = {
        metaQube: memberProfile.metaQube,
        blakQube,
      }

      const metadata = JSON.stringify({
        name: `iQube NFT #${Date.now()}`,
        description: 'An encrypted iQube NFT',
        image: '',
        attributes: Object.entries(updatedMetaData).map(([k, value]) => ({
          trait_type: k,
          value: value,
        })),
      })

      const metadataUpload = await pinata.upload.json(JSON.parse(metadata))
      const url = `${import.meta.env.VITE_GATEWAY_URL}/ipfs/${
        metadataUpload.IpfsHash
      }`

      setMetaQubeLocation(url)
      setEncryptedURL(url)

      await mintQube(url, key)
      setIsMinted(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to mint NFT')
      console.error('Minting error:', error)
    } finally {
      setBtnText('Mint Qube')
      setIsLoading(false)
    }
  }

  const onRetrieveMetadata = async (e: FormEvent) => {
    e.preventDefault()
  }

  const [testMintStatus, setTestMintStatus] = useState<string>('')

  const handleTestMintNoEncryption = async () => {
    setTestMintStatus('')
    setError('')
    if (!address) {
      setError('Please connect your wallet first.')
      return
    }
    setBtnText('Minting...')
    setIsLoading(true)
    try {
      setTestMintStatus('Uploading metadata to IPFS...')
      const testMetadata = JSON.stringify({
        name: `iQube Test #${Date.now()}`,
        description: 'Test mint (encryption server skipped)',
        image: '',
        attributes: [{ trait_type: 'test', value: 'true' }],
      })
      let url: string
      try {
        const metadataUpload = await pinata.upload.json(JSON.parse(testMetadata))
        const gatewayUrl = import.meta.env.VITE_GATEWAY_URL
        if (!gatewayUrl) {
          throw new Error('Missing VITE_GATEWAY_URL in .env')
        }
        url = `${gatewayUrl}/ipfs/${metadataUpload.IpfsHash}`
      } catch (pinataErr: unknown) {
        const pinataMsg = pinataErr instanceof Error ? pinataErr.message : String(pinataErr)
        const isPinataLimit = /FORBIDDEN|plan usage limit/i.test(pinataMsg)
        if (isPinataLimit) {
          setError('Pinata account limit reached. Your Pinata plan has hit its usage limit. Use a different Pinata API key (new account), upgrade your Pinata plan, or switch to another IPFS pinning service.')
          setTestMintStatus('Failed at upload step: Pinata blocked.')
        } else {
          setError(`IPFS upload failed: ${pinataMsg}. Check VITE_PINATA_JWT and VITE_GATEWAY_URL in .env`)
          setTestMintStatus('Failed at upload step.')
        }
        return
      }
      const testKey = 'test-key-no-encryption'
      setTestMintStatus('Confirm the transaction in MetaMask...')
      try {
        await mintQube(url, testKey)
      } catch (txErr: unknown) {
        const txMsg = txErr instanceof Error ? txErr.message : String(txErr)
        const shortMsg = (txErr as { shortMessage?: string })?.shortMessage ?? txMsg
        setError(`Transaction failed: ${shortMsg}`)
        setTestMintStatus('Failed at mint step. See error above.')
        return
      }
      setIsMinted(true)
      setTestMintStatus('Mint successful! Check the transaction link below.')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const isBlockedRpc =
        msg.includes('FORBIDDEN') || msg.includes('plan usage limit')
      if (isBlockedRpc) {
        setError('BLOCKED_RPC')
        setTestMintStatus('Switch Polygon Amoy to the public RPC (see message above), then try again.')
      } else {
        setError(msg)
        setTestMintStatus(`Error: ${msg}`)
      }
      console.error('Test mint error:', err)
    } finally {
      setBtnText('Mint Qube')
      setIsLoading(false)
    }
  }

  const handleSwitchToPublicRpc = async () => {
    const ethereum = typeof window !== 'undefined' && (window as unknown as { ethereum?: { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum
    if (!ethereum) return
    try {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x13882',
            chainName: 'Polygon Amoy',
            nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
            rpcUrls: ['https://rpc-amoy.polygon.technology'],
            blockExplorerUrls: ['https://amoy.polygonscan.com'],
          },
        ],
      })
      setTestMintStatus('Network updated. Try "Test mint (no encryption)" again.')
      setError('')
    } catch (e) {
      setError('Could not add network. Please change the RPC URL manually in MetaMask (see instructions above).')
    }
  }

  return (
    <div className="p-[100px]">
      <div className="flex justify-between">
        <h1 className="font-bold text-[23px]">Create Data Qube</h1>
      </div>
      <div className="flex flex-row">
        <div className="w-[50%]">
          <div className="mb-4 p-4 bg-gray-100 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-[10px] text-green-500">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.59c-.63-.63-.18-1.71.63-1.71H16c.63 0 1.17.46 1.17 1.17v1.17c0 .63-.46 1.17-1.17 1.17H9.41c-.63 0-1.17-.46-1.17-1.17v-.63c.63-.63 1.71-.18 1.71.63l2.59 2.59z" />
              </svg>
              MetaQube
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(memberProfile.metaQube).map(([key, value]) => (
                <MetadataInput
                  key={key}
                  field={key}
                  value={value}
                  onChange={(newValue) =>
                    setMemberProfile((prev) => ({
                      ...prev,
                      metaQube: { ...prev.metaQube, [key]: newValue },
                    }))
                  }
                  disabled={isLoading}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-row">
        <form className="w-[50%]" onSubmit={handleMemberProfileMint}>
          <div className="flex flex-wrap">
            <div className="w-[100%]">
              <h4 className="font-bold text-[13px] my-[20px]">BlakQube</h4>
              <hr className="w-[90%] my-[10px]" />
            </div>
            {memberProfile.blakQube &&
              Object.entries(memberProfile.blakQube).map(([key, value]) => (
                <MetadataInput
                  key={key}
                  field={key}
                  value={value}
                  onChange={(newValue) =>
                    setMemberProfile((prev) => ({
                      ...prev,
                      blakQube: { ...prev.blakQube!, [key]: newValue },
                    }))
                  }
                  disabled={isLoading}
                />
              ))}
          </div>
          <hr className="w-[50%] my-[20px]" />
          <button
            type="submit"
            className="bg-blue-500 text-white px-[10px] py-[5px] rounded-[5px] w-[160px]"
            disabled={isLoading}
          >
            {btnText}
          </button>
          <button
            type="button"
            onClick={handleTestMintNoEncryption}
            disabled={isLoading}
            className="ml-2 bg-gray-500 text-white px-[10px] py-[5px] rounded-[5px] text-sm"
          >
            Test mint (no encryption)
          </button>
          {testMintStatus && (
            <p className="text-sm mt-2 text-gray-700" role="status">
              {testMintStatus}
            </p>
          )}
          {error === 'BLOCKED_RPC' && (
            <div className="border border-amber-500 rounded-lg p-4 mt-2 mb-4 max-w-lg bg-amber-50">
              <p className="text-sm font-medium text-gray-800 mb-2">
                MetaMask is using a blocked RPC for Polygon Amoy.
              </p>
              <p className="text-sm text-gray-700 mb-2">
                In MetaMask: open the network list → Polygon Amoy → click the pencil/settings icon → set <strong>New RPC URL</strong> to:
              </p>
              <input
                type="text"
                readOnly
                value="https://rpc-amoy.polygon.technology"
                className="w-full p-2 text-sm bg-white border border-gray-300 rounded font-mono mb-2"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <p className="text-sm text-gray-600 mb-2">Then Save and try again.</p>
              <button
                type="button"
                onClick={handleSwitchToPublicRpc}
                className="bg-amber-500 text-white px-3 py-2 rounded text-sm"
              >
                Switch Polygon Amoy to public RPC
              </button>
            </div>
          )}
          {isMinted && (
            <p className="text-[10px] text-green-500">
              Qube minted successfully
            </p>
          )}
          <p className="text-[10px]">
            {encryptedURL && (
              <Link to={encryptedURL} className="text-[10px]">
                MetaData Generated Successfully:{' '}
                <span className="text-underline text-blue-500">View Meta</span>
              </Link>
            )}
          </p>
          {error && error !== 'BLOCKED_RPC' && <ErrorDisplay error={error} />}
          {transactionResult && (
            <p className="text-[10px] flex">
              To View Tx =
              <a
                href={`https://www.oklink.com/amoy/tx/${transactionResult?.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500"
              >
                Click Here
              </a>
            </p>
          )}
        </form>
        <div className="w-[50%]">
          <h4>Retrieve Metadata</h4>
          <form onSubmit={onRetrieveMetadata}>
            <input
              type="text"
              placeholder="Token ID"
              className="w-[50%] border-[blue] block"
            />
            <button className="bg-blue-500 text-white px-[10px] py-[5px] rounded-[5px] w-[160px]">
              Get Metadata
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default DataQube

const ErrorDisplay: React.FC<{ error: string }> = ({ error }) => (
  <div className="border border-red-500 rounded-[5px] mb-[25px] w-[60%] flex items-center justify-center h-[63px]">
    <p style={{ color: 'red' }}>{error}</p>
  </div>
)

const MetadataInput: React.FC<{
  field: string
  value: string | number
  onChange: (value: string | number) => void
  disabled: boolean
}> = ({ field, value, onChange, disabled }) => (
  <div className="w-[30%]">
    <label className="block text-[12px]">
      {field.replace('Score', '')}: 
    </label>
    <input
      type={typeof value === 'number' ? 'number' : 'text'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      required
      className="w-[95%] border-[blue]"
    />
  </div>
)
