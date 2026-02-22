import React, { useState, useEffect, FormEvent } from 'react'
import { pinata } from '../../utilities/pinata-config'
import axios from 'axios'
import { FileLock, CircleUser, FileLock2 } from 'lucide-react'
import AvalancheNFTInterface from '../../utilities/AvalancheMetaInterface'
import { AvalanceAbi } from '../../abis/AvalanceAbi'

// const contractAddress = '0x42C0BB631Cac21120057956CEA4cBCDDd1775295' // => sepolia
const contractAddress = '0x2629544D7bACF60Eca551C7C5604a22890d572b2' // => avalanche

interface DecryptedInformation {
  [key: string]: string | number | string[]
}

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

interface UserProfileMetaDataFields {
  metaQube: {
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
    entanglementData?: string
    blakQubeContentType?: string
  }
  blakQube: {}
}

export default function AvalancheMinter() {
  const [uploadType, setUploadType] = useState('memberProfile')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [
    nftInterface,
    setNftInterface,
  ] = useState<AvalancheNFTInterface | null>(null)
  const [account, setAccount] = useState<string>('')
  const [metadata, setMetadata] = useState<string>('')
  const [tokenId, setTokenId] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [decryptedLink, setDecryptedLink] = useState<string>('')
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
  const [memberProfile, setMemberProfile] = useState<UserProfileMetaDataFields>(
    {
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
    },
  )

  const [decryptedInformation, setDecryptedInfo] = useState<
    DecryptedInformation
  >({})

  // handles Member related logic
  const handleMemberProfileChange = (
    section: 'metaQube' | 'blakQube',
    field: string,
    value: string | number,
  ) => {
    setMemberProfile((prevProfile) => ({
      ...prevProfile,
      [section]: {
        ...prevProfile[section],
        [field]: value,
      },
    }))
  }

  useEffect(() => {
    const initNFTInterface = async () => {
      try {
        const _interface = new AvalancheNFTInterface(
          contractAddress,
          AvalanceAbi,
        )
        const accounts = await _interface.connectToMetaMask()
        setNftInterface(_interface)
        setAccount(accounts[0])
      } catch (error) {
        setError('Failed to initialize NFT interface')
        console.error('Initialization error:', error)
      }
    }
    initNFTInterface()
  }, [])

  const handleMemberProfileMint = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // encrypt blakQube information
      let _memberProfile = { ...memberProfile }

      let _blakQube = _memberProfile.blakQube

      let { data } = await axios.post(
        `https://iqubes-server.onrender.com/encrypt-member-qube`,
        _blakQube,
      )

      console.log(data)

      if (data.success) {
        const { encryptedBlakQube: blakQube, key } = data?.encryptedData
        _memberProfile.metaQube.blakQubeKey = key
        const updatedMetaData = {
          metaQube: _memberProfile.metaQube,
          blakQube,
        }

        const metadata = JSON.stringify({
          name: `iQube NFT #${Date.now()}`,
          description: 'An encrypted iQube NFT',
          image: '',
          attributes: [
            ...Object.entries(updatedMetaData).map(([key, value]) => ({
              trait_type: key,
              value: value,
            })),
          ],
        })

        // Upload JSON to IPFS
        const metadataUpload = await pinata.upload.json(JSON.parse(metadata))

        // mint the member data qube
        const receipt = await nftInterface?.mintQube(
          `ipfs://${metadataUpload.IpfsHash}`,
          key,
        )

        const newTokenId = await nftInterface?.getTokenIdFromReceipt(receipt)
        if (newTokenId) {
          setTokenId(newTokenId)
          console.log('NFT minted successfully with token ID:', newTokenId)
        } else {
          console.log("NFT minted successfully, but couldn't retrieve token ID")
        }
      }

      return
    } catch (error) {
      console.error('Error minting member profile NFT:', error)
      setError(
        'Failed to mint member profile NFT. Please check console for details.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  // handles all BLOB related logic
  const handleToggle = (type: string) => {
    setUploadType(type === 'memberProfile' ? 'memberProfile' : 'mediaBlob')
  }

  const getEncryptionData = async (uri: string) => {
    try {
      let http = await axios.post(
        'https://iqubes-server.onrender.com/get-encryption-key',
        {
          uri,
        },
      )
      return http?.data
    } catch (error) {
      console.error(error)
    }
  }

  const decryptData = async (key: string, encryptedText: string) => {
    try {
      let http = await axios.post(
        'https://iqubes-server.onrender.com/decrypt',
        {
          key,
          encryptedText,
        },
      )
      return http.data
    } catch (error) {
      console.log(error)
    }
  }

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
    if (!selectedFile || !nftInterface) {
      setError('Missing required information')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Upload file to IPFS via Pinata
      const upload = await pinata.upload.file(selectedFile)

      // Get Enc data.
      const encrypted = await getEncryptionData(upload.IpfsHash)

      // Update metadata fields => to be replaced with AI agents.
      const updatedMetadataFields: MetadataFields = {
        ...metadataFields,
        iQubeKey: tokenId || `iQube-${Date.now()}`,
        // metaQubeLocation: `ipfs://${upload.IpfsHash}`, //can only be gotten after the mint, so, its impossible
        transactionDate: new Date().toISOString(),
        blakQubeKey: encrypted.data,
        blakQubeLocation: encrypted.data,
        blakQubeIdentifier: `iQube-${Date.now()}`,
        metaQubeCreator: account,
      }

      // Create and upload metadata
      const metadata = JSON.stringify({
        name: `iQube NFT #${Date.now()}`,
        description: 'An encrypted iQube NFT',
        image: encrypted.data,
        attributes: [
          { trait_type: 'Encrypted', value: 'True' },
          ...Object.entries(updatedMetadataFields).map(([key, value]) => ({
            trait_type: key,
            value: value,
          })),
        ],
      })

      const metadataUpload = await pinata.upload.json(JSON.parse(metadata))

      // Mint NFT
      const receipt = await nftInterface.mintQube(
        `ipfs://${metadataUpload.IpfsHash}`,
        encrypted.key,
      )
      const newTokenId = await nftInterface.getTokenIdFromReceipt(receipt)
      if (newTokenId) {
        setTokenId(newTokenId)
        console.log('NFT minted successfully with token ID:', newTokenId)
      } else {
        console.log("NFT minted successfully, but couldn't retrieve token ID")
      }
    } catch (error) {
      console.error('Error minting NFT:', error)
      setError('Failed to mint NFT. Please check console for details.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetrieveMetadata = async () => {
    console.log('retrieving meta data')
    console.log(import.meta.env.VITE_GATEWAY_URL)
    setDecryptedLink('')
    setMetadata('')

    if (!tokenId || !nftInterface) {
      setError('Missing token ID or NFT interface')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const metadataURI = await nftInterface.getBlakQube(tokenId)
      console.log(metadataURI)
      let fullPath = metadataURI.replace(
        'ipfs://',
        `${import.meta.env.VITE_GATEWAY_URL}/ipfs/`,
      )

      setMetadata(fullPath)
    } catch (error) {
      console.error('Error retrieving metadata:', error)
      setError('Failed to retrieve metadata. Please check console for details.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDecrypt = async () => {
    if (!tokenId || !nftInterface) {
      setError('Missing required information')
      return
    }

    setIsLoading(true)
    setError('')
    setDecryptedLink('')

    try {
      // Check if the current account is the owner of the token
      const owner = await nftInterface.ownerOf(tokenId)
      if (owner.toLowerCase() !== account.toLowerCase()) {
        throw new Error('You are not the owner of this token')
      }

      const encryptionKey = await nftInterface.getEncryptionKey(tokenId)
      const metadataURI = await nftInterface.getBlakQube(tokenId)

      // Fetch metadata from IPFS
      const metadataResponse = await fetch(
        metadataURI.replace(
          'ipfs://',
          `${import.meta.env.VITE_GATEWAY_URL}/ipfs/`,
        ),
      )
      const metadata = await metadataResponse.json()

      // Find the blakQubeLocation attribute
      const blakQubeLocationAttr = metadata.attributes.find(
        (attr: any) => attr.trait_type === 'blakQubeKey',
      )

      if (!blakQubeLocationAttr)
        throw new Error('Encrypted data not found in metadata')

      // Decrypt the content using the encryption key
      const decrypted = await decryptData(
        encryptionKey,
        blakQubeLocationAttr.value,
      )

      const fullUrl = `${import.meta.env.VITE_GATEWAY_URL}/ipfs/${
        decrypted.response
      }`
      console.log(fullUrl)
      setDecryptedLink(fullUrl)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred'
      console.error(errorMessage)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMemberDataDecryption = async () => {
    if (!tokenId || !nftInterface) {
      setError('Missing required information')
      return
    }

    setIsLoading(true)
    setError('')
    setDecryptedLink('')
    try {
      // Check if the current account is the owner of the token
      const owner = await nftInterface.ownerOf(tokenId)
      if (owner.toLowerCase() !== account.toLowerCase()) {
        throw new Error('You are not the owner of this token')
      }

      const encryptionKey = await nftInterface.getEncryptionKey(tokenId)
      const metadataURI = await nftInterface.getBlakQube(tokenId)

      // Fetch metadata from IPFS
      const metadataResponse = await fetch(
        metadataURI.replace(
          'ipfs://',
          `${import.meta.env.VITE_GATEWAY_URL}/ipfs/`,
        ),
      )
      const metadata = await metadataResponse.json()
      console.log(metadata)
      const blakQube = metadata.attributes[1].value
      console.log(blakQube)
      if (!blakQube) throw new Error('Encrypted data not found in metadata')

      // Decrypt the content using the encryption key
      let { data } = await axios.post(
        `https://iqubes-server.onrender.com/decrypt-member-data`,
        {
          key: encryptionKey,
          encryptedData: blakQube,
        },
      )

      if (data.success) {
        const decryptedData = data.decryptedData
        setDecryptedInfo(decryptedData)
      }

      // const fullUrl = `${import.meta.env.VITE_GATEWAY_URL}/ipfs/${
      //   decrypted.response
      // }`
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred'
      console.error(errorMessage)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="">
      <div className="w-[100%] justify-between bg-[#fff] p-[100px] flex">
        <div className="w-[50%]">
          <h1 className="font-bold text-[23px]">Create Qube.</h1>
          <hr className="w-[20%] my-[10px]" />
          <div className="flex my-[20px]">
            <div
              className={`${
                uploadType === 'memberProfile' ? 'border-b border-b-[blue]' : ''
              }  mr-[10px] cursor-pointer flex items-center pb-[10px]`}
              onClick={() => handleToggle('memberProfile')}
            >
              <CircleUser color="blue" className="mr-[10px]" />
              <h5 className={`text-[blue] text-[12px]`}>Member Profile</h5>
            </div>
            <div
              className={`${
                uploadType === 'mediaBlob' ? 'border-b border-b-[blue]' : ''
              }  mr-[10px] cursor-pointer flex items-center pb-[10px]`}
              onClick={() => handleToggle('mediaBlob')}
            >
              <FileLock2 color="blue" className="mr-[10px]" />
              <h5 className={`text-[blue] text-[12px]`}>Upload Blob</h5>
            </div>
          </div>
          {uploadType !== 'memberProfile' ? (
            <form onSubmit={handleMint}>
              <div>
                {error && (
                  <div className="border border-red-500 rounded-[5px] mb-[25px] w-[60%] flex items-center justify-center h-[63px]">
                    <p style={{ color: 'red' }}>{error}</p>
                  </div>
                )}
                <label htmlFor="" className="block font-[500] text-[12px]">
                  Upload File.
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="flex flex-wrap w-[60%]">
                {Object.entries(metadataFields).map(([key, value]) => (
                  <div key={key} className="w-[30%]">
                    <label className="block text-[12px]">{key}: </label>
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
              <button disabled={isLoading} className="w-[170px]">
                {isLoading ? 'Encrypting ...' : 'Encrypt Qube'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMemberProfileMint}>
              <div>
                {error && (
                  <div className="border border-red-500 rounded-[5px] mb-[25px] w-[60%] flex items-center justify-center h-[63px]">
                    <p style={{ color: 'red' }}>{error}</p>
                  </div>
                )}
                <h3 className="font-bold text-[18px] mb-[10px]">MetaQube</h3>
                <div className="flex flex-wrap w-[100%]">
                  {Object.entries(memberProfile.metaQube).map(
                    ([key, value]) => (
                      <div key={key} className="w-[30%] mb-[10px]">
                        <label className="block text-[12px]">{key}: </label>
                        <input
                          type={typeof value === 'number' ? 'number' : 'text'}
                          value={value}
                          onChange={(e) =>
                            handleMemberProfileChange(
                              'metaQube',
                              key,
                              e.target.value,
                            )
                          }
                          disabled={isLoading}
                          required
                          className="w-[95%] border-[blue] text-[12px]"
                        />
                      </div>
                    ),
                  )}
                </div>
                <div className="flex items-center mb-[10px] mt-[20px]">
                  <FileLock className="mr-[10px]" />
                  <h3 className="font-bold text-[18px]">BlakQube</h3>
                </div>

                <div className="border p-[30px] border-[grey] rounded-[10px] bg-[#f6f6f6]">
                  <div className="flex flex-wrap w-[100%]">
                    {Object.entries(memberProfile.blakQube).map(
                      ([key, value]) => (
                        <div key={key} className="w-[33.3%] mb-[10px]">
                          <label className="block text-[10px] font-[500] text-[grey]">
                            {key}:{' '}
                          </label>
                          <input
                            type={typeof value === 'number' ? 'number' : 'text'}
                            value={
                              Array.isArray(value)
                                ? value.join(', ')
                                : typeof value === 'string' ||
                                  typeof value === 'number'
                                ? value
                                : ''
                            }
                            onChange={(e) =>
                              handleMemberProfileChange(
                                'blakQube',
                                key,
                                e.target.value,
                              )
                            }
                            disabled={isLoading}
                            required
                            className="w-[95%] border-[grey] text-[12px]"
                          />
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
              <button
                disabled={isLoading}
                className={`w-[200px] mt-[20px] text-[12px] flex items-center justify-center ${
                  isLoading ? 'bg-[grey]' : 'bg-[blue]'
                }`}
              >
                <FileLock className="mr-[10px]" />
                {isLoading ? 'Encrypting...' : 'Encrypt Member Profile'}
              </button>
            </form>
          )}
        </div>
        <div className="w-[50%]">
          <h2 className="font-bold text-[23px]">Retrieve Metadata</h2>
          <hr className="w-[20%] my-[10px]" />
          <input
            type="text"
            placeholder="Token ID"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            disabled={isLoading}
            className="w-[30%] border-[blue] block"
          />
          <button
            onClick={handleRetrieveMetadata}
            disabled={isLoading}
            className="mr-[50px]"
          >
            {isLoading ? 'Retrieving...' : 'Get Metadata'}
          </button>
          {uploadType !== 'memberProfile' ? (
            <>
              {/* <p>Metadata URI: {metadata}</p> */}
              {metadata && (
                <a
                  href={metadata}
                  className="text-[blue]"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  click to see data
                </a>
              )}
              <hr className="my-[50px]" />
              <h2 className="font-bold text-[23px]">Decrypt Content</h2>
              <button
                onClick={handleDecrypt}
                disabled={isLoading}
                className="mr-[50px]"
              >
                {isLoading ? 'Decrypting...' : 'Decrypt'}
              </button>{' '}
              {decryptedLink && (
                <a
                  href={decryptedLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className=" text-[blue] underline"
                >
                  See Decrypted Information Data.
                </a>
              )}
            </>
          ) : (
            <>
              {/* <p>Metadata URI: {metadata}</p> */}
              {metadata && (
                <a
                  href={metadata}
                  className="text-[blue]"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View MetaQube
                </a>
              )}
              <hr className="my-[50px]" />
              <h2 className="font-bold text-[23px]">Decrypt Member Data</h2>
              <button
                onClick={handleMemberDataDecryption}
                disabled={isLoading}
                className="mr-[50px]"
              >
                {isLoading ? 'Decrypting...' : 'Decrypt'}
              </button>{' '}
              {decryptedLink && (
                <a
                  href={decryptedLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className=" text-[blue] underline"
                >
                  See Decrypted Information Data.
                </a>
              )}
              <div className="px-[50px]">
                <table className="table text-[12px] mt-[20px] w-[100%]">
                  <thead>
                    <tr>
                      <td>Attribute</td>
                      <td>Data</td>
                    </tr>
                  </thead>
                  <tbody className="border">
                    {Object.keys(decryptedInformation).map((key) => (
                      <tr key={key} className="border h-[50px]">
                        <td className="px-[20px] border">{key}</td>
                        <td className="px-[20px] border font-[700]">
                          {decryptedInformation[key]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
