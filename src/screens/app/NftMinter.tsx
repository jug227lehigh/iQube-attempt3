import React, { useState, useEffect, FormEvent } from 'react'
import { ABI } from '../../utilities/ABI'
import { pinata } from '../../utilities/pinata-config'
import PolygonNFTInterface from '../../utilities/MetaContract'
import axios from 'axios'
import { CircleUser, FileLock2, Send } from 'lucide-react'
import Web3CrossChain from './With3rdWeb/CrossChain'
import ContentQube from './ContentQube'
import AgentQube from './AgentQube'

const CONTRACT_ADDRESS = '0x632E1d32e34F0A690635BBcbec0D066daa448ede'

interface DecryptedInformation {
  [key: string]: string | number | string[]
}

interface MetadataFields {
  iQubeIdentifier: string
  iQubeCreator: string
  ownerType: 'Person' | 'Organisation' | 'Thing'
  iQubeContentType: 'mp3' | 'mp4' | 'pdf' | 'txt' | 'Code' | 'Other'
  ownerIdentifiability: 'Anonymous' | 'Semi-Anonymous' | 'Identifiable' | 'Semi-Identifiable'
  transactionDate: string
  sensitivityScore: number
  verifiabilityScore: number
  accuracyScore: number
  riskScore: number
}

interface UserProfileMetaDataFields {
  metaQube: MetadataFields
  blakQube: {
    firstName: string
    lastName: string
    fioHandle: string
    email: string
    phoneNumber: string
    ageRange: string
    address: string
    metaiyeShares: number
    kyntCoinOwned: number
    omMemberSince: number
    omTierStatus: string
    evmPublicKey: string
    thirdWebPublicKey: string
    metaMaskPublicKey: string
    otherWalletPublicKeys: string[]
    metaKeepId: string
    twitterHandle: string
    instagramHandle: string
    facebookId: string
    tikTokHandle: string
    linkedInId: string
    discordHandle: string
    telegramHandle: string
    motionKNYTBooksOwned: string[]
    stillKNYTBooksOwned: string[]
    printKNYTBooksOwned: string[]
    knytPostersOwned: string[]
    knytCardsOwned: string[]
    knytCharactersOwned: string[]
  }
}

interface AgentQubeMetaDataFields {
  metaQube: MetadataFields
  blakQube: {
    agentName: string
    agentVersion: string
    agentType: string
    agentCapabilities: string[]
    agentLanguages: string[]
    agentFrameworks: string[]
    agentAPIs: string[]
    agentLicenses: string[]
    agentOwner: string
    agentDeveloper: string
    agentStatus: string
    agentDeploymentType: string
    agentHostingPlatform: string
    agentEndpoints: string[]
    agentAuthentication: string
    agentRateLimits: string
    agentUsageCosts: string
    agentPerformanceMetrics: string
    agentMaintenanceSchedule: string
    agentUpdatesHistory: string[]
    latencyPerToolCall: string
    apiCallFrequency: string
    contextWindowUtilization: string
    llmCallErrorRate: string
    taskCompletionTime: string
    memoryUsage: string
    responseAccuracy: string
    agentQubeId: string
    summaryDescription: string
    uniqueIdentifier: string
    abiServicesMenu: string[]
    abiQueryMethod: string
    abiInputIQubes: string[]
    abiUsageIQubes: string[]
    abiOutputIQubes: string[]
    abiFunctionManifest: string[]
    abiSystemPrompting: string
    abiModelRequirements: string[]
    agentIpOwnership: string
    trainingDatasets: string
    verifiableTransactions: string
    agentInstanceOwner: string
    agentWalletPublicKey: string
    agentWeights: string
    agentBiases: string
    agentWalletBalance: string
    tokenUsagePerInteraction: string
    energyConsumption: string
    resourceUtilizationEfficiency: string
    roiMetrics: string
    scalabilityIndicators: string
    instructionAdherence: string
    hallucinationRate: string
    outputFormatSuccessRate: string
    contextAdherence: string
    errorDisparity: string
    systemUptime: string
    errorRecoveryRate: string
    codeQualityMetrics: string
    testCoverage: string
    bugDetectionRate: string
    documentationQuality: string
    agentSuccessRate: string
    eventRecallAccuracy: string
    agentWaitTime: string
    taskCompletionRate: string
    humanRequestRate: string
    stepsPerTask: string
    toolSelectionAccuracy: string
    userSatisfactionScore: string
    responseTimeSatisfaction: string
    interactionQuality: string
    featureAdoptionRate: string
    userRetention: string
  }
}

const IQubeNFTMinter: React.FC = () => {
  const [uploadType, setUploadType] = useState<string>('memberProfile')
  const [activeTab, setActiveTab] = useState<string>('mint')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [nftInterface, setNftInterface] = useState<PolygonNFTInterface | null>(
    null,
  )
  const [account, setAccount] = useState<string>('')
  const [metadata, setMetadata] = useState<string>('')
  const [tokenId, setTokenId] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [decryptedLink, setDecryptedLink] = useState<string>('')
  const [metadataFields, setMetadataFields] = useState<MetadataFields>({
    iQubeIdentifier: 'OM KNYT Qube Alpha',
    iQubeCreator: 'Metaiye Media DiD',
    ownerType: 'Person',
    iQubeContentType: 'txt',
    ownerIdentifiability: 'Identifiable',
    transactionDate: new Date().toISOString(),
    sensitivityScore: 5,
    verifiabilityScore: 7,
    accuracyScore: 6,
    riskScore: 4,
  })
  const [memberProfile, setMemberProfile] = useState<UserProfileMetaDataFields>({
    metaQube: {
      iQubeIdentifier: 'OM KNYT Qube Alpha',
      iQubeCreator: 'Metaiye Media DiD',
      ownerType: 'Person',
      iQubeContentType: 'txt',
      ownerIdentifiability: 'Identifiable',
      transactionDate: new Date().toISOString(),
      sensitivityScore: 5,
      verifiabilityScore: 7,
      accuracyScore: 6,
      riskScore: 4,
    },
    blakQube: {
      firstName: 'Dele',
      lastName: 'Atanda',
      fioHandle: 'Qrypto@KNYT',
      email: 'info@metame.com',
      phoneNumber: '787 888 8888',
      ageRange: '35-45',
      address: '23 My home',
      metaiyeShares: 439,
      kyntCoinOwned: 3000,
      omMemberSince: 2019,
      omTierStatus: 'ZeroKnyt',
      evmPublicKey: 'arkagent.eth',
      thirdWebPublicKey: 'oX34355464656465',
      metaMaskPublicKey: 'qrypto@knyt',
      otherWalletPublicKeys: ['qrypto@knyt', 'arkagent.eth'],
      metaKeepId: 'info@metame.com',
      twitterHandle: 'www.x.com/Arkagent',
      instagramHandle: 'www.instagram.com/arkagent',
      facebookId: 'www.facebook.com/deleatanda',
      tikTokHandle: 'www.titktok.com/arkagent',
      linkedInId: 'www.linlind.com/in/dedleatanda',
      discordHandle: 'QryptoKnyt',
      telegramHandle: 'QryptoKnyt',
      motionKNYTBooksOwned: ['#0E', '#1R', '#2L', '#3E', '#5E', '#6L', '#8R', '#9R'],
      stillKNYTBooksOwned: ['#0', '#1', '#2', '#3', '#4', '#5', '#6', '#7', '#8', '#9', '#10', '#11'],
      printKNYTBooksOwned: ['#0E', '#1R', '#2L', '#3E', '#5E', '#6L', '#8R'],
      knytPostersOwned: ['#0', '#1', '#2', '#3', '#4', '#5', '#6', '#7', '#8', '#9'],
      knytCardsOwned: ['#0', '#1', '#2', '#3'],
      knytCharactersOwned: ['Emmissary#18', 'Deji#2'],
    },
  })

  const [agentProfile, setAgentProfile] = useState<AgentQubeMetaDataFields>({
    metaQube: {
      iQubeIdentifier: 'Agent Qube Alpha',
      iQubeCreator: 'Metaiye Media DiD',
      ownerType: 'Person',
      iQubeContentType: 'Code',
      ownerIdentifiability: 'Identifiable',
      transactionDate: new Date().toISOString(),
      sensitivityScore: 5,
      verifiabilityScore: 7,
      accuracyScore: 6,
      riskScore: 4,
    },
    blakQube: {
      agentName: 'Cascade AI',
      agentVersion: '1.0.0',
      agentType: 'Coding Assistant',
      agentCapabilities: ['Code Generation', 'Code Review', 'Debugging'],
      agentLanguages: ['TypeScript', 'JavaScript', 'Python', 'Solidity'],
      agentFrameworks: ['React', 'Node.js', 'Web3.js'],
      agentAPIs: ['OpenAI', 'GitHub', 'Pinata'],
      agentLicenses: ['MIT'],
      agentOwner: 'Metaiye Media',
      agentDeveloper: 'Codeium',
      agentStatus: 'Active',
      agentDeploymentType: 'Cloud',
      agentHostingPlatform: 'AWS',
      agentEndpoints: ['api.cascade.ai/v1'],
      agentAuthentication: 'OAuth2.0',
      agentRateLimits: '100 requests/minute',
      agentUsageCosts: 'Free Tier',
      agentPerformanceMetrics: 'Response Time: 200ms',
      agentMaintenanceSchedule: 'Weekly',
      agentUpdatesHistory: ['1.0.0 - Initial Release'],
      latencyPerToolCall: 'Average 250ms per API call',
      apiCallFrequency: '~1000 calls/day',
      contextWindowUtilization: '85%',
      llmCallErrorRate: '<1%',
      taskCompletionTime: '3-5 seconds',
      memoryUsage: '2GB average',
      responseAccuracy: '98%',
      agentQubeId: 'CascadeAI-v1.0',
      summaryDescription: 'Advanced coding assistant and development agent',
      uniqueIdentifier: '0xCA23...4567',
      abiServicesMenu: ['Code Generation', 'Code Review', 'Debugging', 'Testing'],
      abiQueryMethod: 'Natural language programming queries',
      abiInputIQubes: ['CodeQube', 'TestQube'],
      abiUsageIQubes: ['Code templates', 'Testing patterns'],
      abiOutputIQubes: ['Generated code', 'Review reports'],
      abiFunctionManifest: ['generate_code()', 'review_code()', 'debug_code()'],
      abiSystemPrompting: 'Expert programmer with security focus',
      abiModelRequirements: ['GPT-4', 'Code analysis models'],
      agentIpOwnership: 'Centralized - Codeium / 0xCA23...4567',
      trainingDatasets: '100M code snippets',
      verifiableTransactions: '500k verified coding sessions',
      agentInstanceOwner: 'Codeium AI Division',
      agentWalletPublicKey: 'cascade.eth',
      agentWeights: 'Programming domain fine-tuning v1.5',
      agentBiases: 'Security-first bias: 0.3',
      agentWalletBalance: '3.5 ETH',
      tokenUsagePerInteraction: '1500 tokens average',
      energyConsumption: '0.3 kWh per 1000 operations',
      resourceUtilizationEfficiency: '82%',
      roiMetrics: '280% ROI on deployment',
      scalabilityIndicators: 'Can handle 5k concurrent users',
      instructionAdherence: '98%',
      hallucinationRate: '<0.05%',
      outputFormatSuccessRate: '99.9%',
      contextAdherence: '96%',
      errorDisparity: '<1.5%',
      systemUptime: '99.99%',
      errorRecoveryRate: '99%',
      codeQualityMetrics: 'A+ rating',
      testCoverage: '94%',
      bugDetectionRate: '97%',
      documentationQuality: '4.9/5',
      agentSuccessRate: '95%',
      eventRecallAccuracy: '99%',
      agentWaitTime: '<80ms',
      taskCompletionRate: '98%',
      humanRequestRate: '3%',
      stepsPerTask: '3',
      toolSelectionAccuracy: '97%',
      userSatisfactionScore: '4.8/5',
      responseTimeSatisfaction: '94%',
      interactionQuality: '4.9/5',
      featureAdoptionRate: '88%',
      userRetention: '82%'
    }
  })

  const [decryptedInfo, setDecryptedInfo] = useState<DecryptedInformation>({})
  const [decryptedData, setDecryptedData] = useState<any>(null)
  const [metaQubeData, setMetaQubeData] = useState<any>(null)
  const [blakQubeData, setBlakQubeData] = useState<any>(null)
  const [encryptedBlakQubeData, setEncryptedBlakQubeData] = useState<any>(null)

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

  const handleAgentProfileChange = (
    section: 'metaQube' | 'blakQube',
    field: string,
    value: string | number | string[],
  ) => {
    setAgentProfile((prevProfile) => ({
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
        if (typeof window.ethereum === 'undefined') {
          throw new Error('MetaMask is not installed or not detected')
        }

        const _interface = new PolygonNFTInterface(CONTRACT_ADDRESS, ABI)
        
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' })
        } catch (requestError) {
          throw new Error('Failed to request MetaMask accounts: ' + requestError.message)
        }

        const accounts = await _interface.connectToMetaMask()
        
        if (!accounts || accounts.length === 0) {
          throw new Error('No MetaMask accounts found')
        }

        setNftInterface(_interface)
        setAccount(accounts[0])
        console.log('NFT Interface initialized successfully')
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error initializing NFT interface'
        setError(errorMessage)
        console.error('Detailed Initialization Error:', error)
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
        console.log(metadataUpload.IpfsHash)
        console.log(key)
        console.log(account)

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

  const handleAgentProfileMint = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (!nftInterface) {
        throw new Error('NFT interface not initialized')
      }

      // encrypt blakQube information
      let _agentProfile = { ...agentProfile }
      let _blakQube = _agentProfile.blakQube

      console.log('Encrypting agent data:', _blakQube)
      
      // First get an encryption key
      const keyResponse = await axios.post(
        `https://iqubes-server.onrender.com/get-encryption-key`,
        { uri: 'agent-qube' }
      )

      if (!keyResponse.data || !keyResponse.data.key) {
        throw new Error('Failed to get encryption key')
      }

      const key = keyResponse.data.key
      console.log('Got encryption key:', key)

      // Then encrypt the data
      const encryptResponse = await axios.post(
        `https://iqubes-server.onrender.com/encrypt`,
        {
          key: key,
          text: JSON.stringify(_blakQube)
        }
      )

      if (!encryptResponse.data || !encryptResponse.data.encryptedText) {
        throw new Error('Failed to encrypt data')
      }

      console.log('Encryption successful')

      // Prepare metadata
      const metadata = JSON.stringify({
        name: `iQube NFT #${Date.now()}`,
        description: 'An encrypted AgentQube NFT',
        attributes: [
          {
            trait_type: 'metaQube',
            value: _agentProfile.metaQube
          },
          {
            trait_type: 'blakQube',
            value: encryptResponse.data.encryptedText
          }
        ]
      })

      console.log('Uploading metadata to IPFS:', metadata)

      // Upload to IPFS
      const metadataUpload = await pinata.upload.json(JSON.parse(metadata))
      console.log('IPFS upload successful:', metadataUpload)

      // Mint the NFT
      const receipt = await nftInterface.mintQube(
        `ipfs://${metadataUpload.IpfsHash}`,
        key
      )

      const newTokenId = await nftInterface.getTokenIdFromReceipt(receipt)
      if (newTokenId) {
        setTokenId(newTokenId)
        console.log('AgentQube minted successfully with token ID:', newTokenId)
      } else {
        console.log("AgentQube minted successfully, but couldn't retrieve token ID")
      }

    } catch (error: any) {
      console.error('Error minting AgentQube NFT:', error)
      setError(error.response?.data?.message || error.message || 'Failed to mint AgentQube NFT')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = (type: string) => {
    setUploadType(type)
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

  const handleMint = async (contentQubeData: any) => {
    try {
      setIsLoading(true)
      setError(null)

      if (!contentQubeData.blakQube.blobFile) {
        throw new Error('Please select a file to mint')
      }

      if (!nftInterface) {
        throw new Error('Web3 connection not initialized. Please check your wallet connection.')
      }

      // Upload file to IPFS via Pinata
      const upload = await pinata.upload.file(contentQubeData.blakQube.blobFile)

      // Get Enc data for the file
      const encryptedFile = await getEncryptionData(upload.IpfsHash)

      // Encrypt BlakQube data
      const { data: encryptedBlakQube } = await axios.post(
        'https://iqubes-server.onrender.com/encrypt-member-qube',
        {
          ...contentQubeData.blakQube,
          blobFile: null, // Remove the file object before encrypting
          blobPreview: null,
          encryptedFileHash: upload.IpfsHash,
          encryptedFileKey: encryptedFile.key
        }
      )

      if (!encryptedBlakQube.success) {
        throw new Error('Failed to encrypt BlakQube data')
      }

      // Create metadata with both MetaQube and encrypted BlakQube
      const metadata = JSON.stringify({
        name: `iQube NFT #${Date.now()}`,
        description: 'An encrypted iQube NFT',
        image: encryptedFile.data,
        attributes: [
          { trait_type: 'metaQube', value: contentQubeData.metaQube },
          { trait_type: 'blakQube', value: encryptedBlakQube.encryptedData.blakQube }
        ],
      })

      // Upload metadata to IPFS
      const metadataUpload = await pinata.upload.json(JSON.parse(metadata))

      // Mint NFT with the encryption key from BlakQube encryption
      const receipt = await nftInterface.mintQube(
        `ipfs://${metadataUpload.IpfsHash}`,
        encryptedBlakQube.encryptedData.key
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
      setError(handleError(error))
    } finally {
      setIsLoading(false)
    }
  }

  const formatDisplayValue = (value: any, isBlakQube: boolean = false): string => {
    // Helper to detect encrypted content
    const looksEncrypted = (val: any): boolean => {
      if (typeof val !== 'string') return false;
      return val.length > 50 && /^[A-Za-z0-9+/=]{50,}$/.test(val);
    };

    // For BlakQube data, handle differently
    if (isBlakQube) {
      if (typeof value === 'string') {
        // Always truncate long strings, whether encrypted or decrypted
        return value.length > 40 ? `${value.substring(0, 40)}...` : value;
      }
      if (Array.isArray(value)) {
        return value.join(', ');
      }
    }

    // Handle different value types
    if (value === null || value === undefined) {
      return '-';
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      // Check if it's an encryption object
      if (value.iv || value.cipher || value.ciphertext || value.tag) {
        const ciphertext = value.ciphertext || value.cipher || '';
        return ciphertext.length > 40 ? `${ciphertext.substring(0, 40)}...` : ciphertext;
      }
      // For other objects, show type
      return '{Object}';
    }
    
    if (typeof value === 'string') {
      // Always truncate long strings
      return value.length > 40 ? `${value.substring(0, 40)}...` : value;
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      return value.join(', ');
    }

    return String(value);
  }

  const handleRetrieveMetadata = async () => {
    console.log('retrieving meta data')
    setDecryptedLink('')
    setMetadata('')
    setMetaQubeData(null)
    setBlakQubeData(null)

    if (!tokenId || !nftInterface) {
      setError('Missing token ID or NFT interface')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const metadataURI = await nftInterface.getBlakQube(tokenId)
      let fullPath = metadataURI.replace(
        'ipfs://',
        `${import.meta.env.VITE_GATEWAY_URL}/ipfs/`,
      )

      // Fetch and parse metadata
      const response = await fetch(fullPath)
      const data = await response.json()
      
      // Extract MetaQube and BlakQube data from attributes
      const metaQubeAttrs = data.attributes.find((attr: any) => attr.trait_type === 'metaQube')?.value || {}
      const blakQubeAttrs = data.attributes.find((attr: any) => attr.trait_type === 'blakQube')?.value || {}
      
      // Remove blakQube-related fields
      const {
        blakQubeKey,
        blakQubeLocation,
        blakQubeIdentifier,
        ...cleanMetaQubeData
      } = metaQubeAttrs

      // Format MetaQube values
      const formattedMetaQubeData = Object.entries(cleanMetaQubeData).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: formatDisplayValue(value, false)
        }),
        {}
      )

      // Format BlakQube values
      const formattedBlakQubeData = Object.entries(blakQubeAttrs).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: formatDisplayValue(value, true)
        }),
        {}
      )
      
      setMetaQubeData(formattedMetaQubeData)
      setEncryptedBlakQubeData(formattedBlakQubeData) // Store encrypted data separately
      setBlakQubeData(null) // Clear any previous decrypted data
      setMetadata(fullPath)
    } catch (error) {
      console.error('Error retrieving metadata:', error)
      setError('Failed to retrieve metadata. Please check console for details.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMemberDataDecryption = async () => {
    setIsLoading(true)
    setError('')
    try {
      if (!nftInterface || !account) {
        throw new Error('NFT interface not initialized or wallet not connected')
      }

      // Get the metadata URI using getBlakQube
      const metadataURI = await nftInterface.getBlakQube(tokenId)
      console.log('Fetching metadata from:', metadataURI)

      const metadataResponse = await fetch(
        metadataURI.replace(
          'ipfs://',
          `${import.meta.env.VITE_GATEWAY_URL}/ipfs/`,
        ),
      )

      if (!metadataResponse.ok) {
        throw new Error(`Failed to fetch metadata: ${metadataResponse.statusText}`)
      }

      const metadata = await metadataResponse.json()
      console.log('Metadata retrieved:', metadata)

      // Find the blakQube attribute
      const blakQubeAttribute = metadata.attributes?.find(
        (attr: any) => attr.trait_type === 'blakQube'
      )

      if (!blakQubeAttribute) {
        throw new Error('No blakQube data found in metadata')
      }

      try {
        console.log('Attempting to decrypt with tokenId:', tokenId)
        console.log('BlakQube value:', blakQubeAttribute.value)
        
        // Get the encryption key first
        let encryptionKey
        try {
          encryptionKey = await nftInterface.getEncryptionKey(tokenId)
        } catch (keyError: any) {
          // Check specifically for Web3 JSON-RPC error
          if (keyError.message?.includes('Internal JSON-RPC error')) {
            throw new Error('You cannot decrypt this blakQube as you do not own its token')
          }
          throw keyError
        }

        console.log('Encryption key retrieved:', encryptionKey)

        if (!encryptionKey) {
          throw new Error('Failed to retrieve encryption key')
        }

        // Make the decryption request to the server
        const response = await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/decrypt-member-data`,
          {
            key: encryptionKey,
            encryptedData: blakQubeAttribute.value,
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )

        console.log('Server response:', response.data)

        if (response.data && response.data.decryptedData) {
          console.log('Decryption successful:', response.data.decryptedData)
          setBlakQubeData(response.data.decryptedData)
        } else {
          throw new Error('Server response missing decrypted data')
        }
      } catch (decryptError: any) {
        console.error('Full decryption error:', decryptError)
        // If it's our custom error message, throw it as is
        if (decryptError.message?.includes('You cannot decrypt this blakQube')) {
          throw decryptError
        }
        // For other errors, throw the original error
        throw decryptError
      }
    } catch (error: any) {
      console.error('Decryption error:', error)
      setError(error.message || 'Failed to decrypt data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleError = (error: any) => {
    if (error.code === 4001 || error.message?.includes('user rejected')) {
      return 'Transaction was rejected in MetaMask. You can try again when ready.'
    } else if (error.message?.includes('network')) {
      return 'Please ensure you are connected to the Polygon Amoy testnet in MetaMask.'
    } else if (error.message?.includes('insufficient funds')) {
      return 'Insufficient funds in your wallet for gas fees. Please add funds and try again.'
    } else if (error.message?.includes('nonce')) {
      return 'Transaction nonce error. Please refresh the page and try again.'
    } else if (error.message?.includes('gas')) {
      return 'Gas estimation failed. The transaction might fail or network might be congested.'
    } else {
      return `Operation failed: ${error.message || 'Unknown error occurred'}. Please try again.`
    }
  }

  const labelMapping: { [key: string]: string } = {
    firstName: 'First Name',
    lastName: 'Last Name',
    fioHandle: 'FIO Handle',
    email: 'Email',
    phoneNumber: 'Phone Number',
    ageRange: 'Age Range',
    address: 'Address',
    metaiyeShares: 'Metaiye Shares',
    kyntCoinOwned: 'KNYT Coin Owned',
    omMemberSince: 'OM Member Since',
    omTierStatus: 'OM Tier Status',
    evmPublicKey: 'EVM Public Key',
    thirdWebPublicKey: 'Third Web Public Key',
    metaMaskPublicKey: 'MetaMask Public Key',
    otherWalletPublicKeys: 'Other Wallet Public Keys',
    metaKeepId: 'Meta Keep ID',
    twitterHandle: 'Twitter Handle',
    instagramHandle: 'Instagram Handle',
    facebookId: 'Facebook ID',
    tikTokHandle: 'TikTok Handle',
    linkedInId: 'LinkedIn ID',
    discordHandle: 'Discord Handle',
    telegramHandle: 'Telegram Handle',
    motionKNYTBooksOwned: 'Motion KNYT Books Owned',
    stillKNYTBooksOwned: 'Still KNYT Books Owned',
    printKNYTBooksOwned: 'Print KNYT Books Owned',
    knytPostersOwned: 'KNYT Posters Owned',
    knytCardsOwned: 'KNYT Cards Owned',
    knytCharactersOwned: 'KNYT Characters Owned'
  };

  const tabNames = {
    mint: 'Mint',
    transfer: 'Transfer',
    knytCharactersOwned: 'KNYT Characters Owned'
  };

  return (
    <div className="">
      {error && (
        <div className="relative bg-red-50 border-l-4 border-red-500 p-4 my-4">
          <div className="flex items-center pr-8">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm text-red-700 font-medium">{error}</p>
              {error.includes('rejected') && (
                <p className="text-xs text-red-600 mt-1">
                  You can safely try again when you're ready to approve the transaction.
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setError(null)}
            className="absolute top-4 right-4 text-red-400 hover:text-red-600 transition-colors"
            aria-label="Close error message"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
      <div className="w-[100%] bg-[#fff] p-[100px] flex flex-col">
        <div className="w-[100%] justify-between flex">
          {/* Left Section - Create Qube */}
          <div className="w-[50%] pr-[20px]">
            <h1 className="font-bold text-[28px] mb-[20px]">Create iQube</h1>
            <hr className="w-[20%] mb-[20px]" />
            <div className="flex my-[20px]">
              {/* Existing tab navigation remains the same */}
              <div
                className={`${
                  uploadType === 'memberProfile' ? 'border-b border-b-[blue]' : ''
                }  mr-[10px] cursor-pointer flex items-center pb-[10px]`}
                onClick={() => handleToggle('memberProfile')}
              >
                <CircleUser color="blue" className="mr-[10px]" />
                <h5 className={`text-[blue] text-[12px]`}>Data Qube</h5>
              </div>
              <div
                className={`${
                  uploadType === 'mediaBlob' ? 'border-b border-b-[blue]' : ''
                } mr-[10px] cursor-pointer flex items-center pb-[10px]`}
                onClick={() => handleToggle('mediaBlob')}
              >
                <FileLock2 color="blue" className="mr-[10px]" />
                <h5 className={`text-[blue] text-[12px]`}>Content Qube</h5>
              </div>
              <div
                className={`${
                  uploadType === 'agent' ? 'border-b border-b-[blue]' : ''
                } mr-[10px] cursor-pointer flex items-center pb-[10px]`}
                onClick={() => handleToggle('agent')}
              >
                <FileLock2 color="blue" className="mr-[10px]" />
                <h5 className={`text-[blue] text-[12px]`}>Agent Qube</h5>
              </div>
            </div>
            {uploadType === 'mediaBlob' ? (
              <div className="flex w-full">
                {/* Left Section - Content Form */}
                <div className="w-full">
                  <ContentQube 
                    nftInterface={nftInterface}
                    onContentChange={(content) => handleMint(content)} 
                  />
                </div>
              </div>
            ) : null}

            {uploadType === 'memberProfile' ? (
              <form onSubmit={handleMemberProfileMint}>
                {/* MetaQube Section */}
                <div className="bg-[#f6f6f6] p-6 rounded-lg">
                  <div className="flex items-center mb-[10px]">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-[10px] text-blue-500">
                      <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
                    </svg>
                    <h3 className="font-bold text-[18px]">MetaQube</h3>
                  </div>

                  {/* First row - 2 items */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 mb-2">
                        iQube Identifier
                      </label>
                      <input
                        type="text"
                        value={memberProfile.metaQube.iQubeIdentifier}
                        onChange={(e) =>
                          handleMemberProfileChange(
                            'metaQube',
                            'iQubeIdentifier',
                            e.target.value,
                          )
                        }
                        className="w-full p-[10px] border rounded-[5px] bg-[#e8f5e9]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 mb-2">
                        iQube Creator
                      </label>
                      <input
                        type="text"
                        value={memberProfile.metaQube.iQubeCreator}
                        onChange={(e) =>
                          handleMemberProfileChange(
                            'metaQube',
                            'iQubeCreator',
                            e.target.value,
                          )
                        }
                        className="w-full p-[10px] border rounded-[5px] bg-[#e8f5e9]"
                        required
                      />
                    </div>
                  </div>

                  {/* Second row - 2 items */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 mb-2">
                        Owner Type
                      </label>
                      <select
                        value={memberProfile.metaQube.ownerType}
                        onChange={(e) =>
                          handleMemberProfileChange(
                            'metaQube',
                            'ownerType',
                            e.target.value,
                          )
                        }
                        className="w-full p-[10px] border rounded-[5px] bg-[#e8f5e9]"
                        required
                      >
                        <option value="Person">Person</option>
                        <option value="Organisation">Organisation</option>
                        <option value="Thing">Thing</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 mb-2">
                        Content Type
                      </label>
                      <select
                        value={memberProfile.metaQube.iQubeContentType}
                        onChange={(e) =>
                          handleMemberProfileChange(
                            'metaQube',
                            'iQubeContentType',
                            e.target.value,
                          )
                        }
                        className="w-full p-[10px] border rounded-[5px] bg-[#e8f5e9]"
                        required
                      >
                        <option value="mp3">MP3</option>
                        <option value="mp4">MP4</option>
                        <option value="pdf">PDF</option>
                        <option value="txt">TXT</option>
                        <option value="Code">Code</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Third row - 2 items */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 mb-2">
                        Owner Identifiability
                      </label>
                      <select
                        value={memberProfile.metaQube.ownerIdentifiability}
                        onChange={(e) =>
                          handleMemberProfileChange(
                            'metaQube',
                            'ownerIdentifiability',
                            e.target.value,
                          )
                        }
                        className="w-full p-[10px] border rounded-[5px] bg-[#e8f5e9]"
                        required
                      >
                        <option value="Anonymous">Anonymous</option>
                        <option value="Semi-Anonymous">Semi-Anonymous</option>
                        <option value="Identifiable">Identifiable</option>
                        <option value="Semi-Identifiable">Semi-Identifiable</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 mb-2">
                        Transaction Date
                      </label>
                      <input
                        type="date"
                        value={memberProfile.metaQube.transactionDate.split('T')[0]}
                        onChange={(e) =>
                          handleMemberProfileChange(
                            'metaQube',
                            'transactionDate',
                            e.target.value,
                          )
                        }
                        className="w-full p-[10px] border rounded-[5px] bg-[#e8f5e9]"
                        required
                      />
                    </div>
                  </div>

                  {/* Fourth row - 4 scores */}
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 mb-2">
                        Sensitivity Score
                      </label>
                      <select
                        value={memberProfile.metaQube.sensitivityScore}
                        onChange={(e) =>
                          handleMemberProfileChange(
                            'metaQube',
                            'sensitivityScore',
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full p-[10px] border rounded-[5px] bg-[#e8f5e9]"
                        required
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7">7</option>
                        <option value="8">8</option>
                        <option value="9">9</option>
                        <option value="10">10</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 mb-2">
                        Verifiability Score
                      </label>
                      <select
                        value={memberProfile.metaQube.verifiabilityScore}
                        onChange={(e) =>
                          handleMemberProfileChange(
                            'metaQube',
                            'verifiabilityScore',
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full p-[10px] border rounded-[5px] bg-[#e8f5e9]"
                        required
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7">7</option>
                        <option value="8">8</option>
                        <option value="9">9</option>
                        <option value="10">10</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 mb-2">
                        Accuracy Score
                      </label>
                      <select
                        value={memberProfile.metaQube.accuracyScore}
                        onChange={(e) =>
                          handleMemberProfileChange(
                            'metaQube',
                            'accuracyScore',
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full p-[10px] border rounded-[5px] bg-[#e8f5e9]"
                        required
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7">7</option>
                        <option value="8">8</option>
                        <option value="9">9</option>
                        <option value="10">10</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 mb-2">
                        Risk Score
                      </label>
                      <select
                        value={memberProfile.metaQube.riskScore}
                        onChange={(e) =>
                          handleMemberProfileChange(
                            'metaQube',
                            'riskScore',
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full p-[10px] border rounded-[5px] bg-[#e8f5e9]"
                        required
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7">7</option>
                        <option value="8">8</option>
                        <option value="9">9</option>
                        <option value="10">10</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* BlakQube Section */}
                <div className="bg-[#f6f6f6] p-6 rounded-lg mt-6">
                  <div className="flex items-center mb-[10px]">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-[10px] text-red-500">
                      <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
                    </svg>
                    <h3 className="font-bold text-[18px]">BlakQube</h3>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(memberProfile.blakQube).map(([key, value]) => (
                      <div key={key} className="mb-[10px]">
                        <label className="block text-[10px] font-[500] text-[grey]">
                          {labelMapping[key] || key}:{' '}
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
                          className="w-[95%] border rounded-[5px] p-[10px] bg-[#ffebee]"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  disabled={isLoading}
                  className={`w-full p-[10px] rounded-[5px] ${
                    isLoading ? 'bg-[grey]' : 'bg-[blue]'
                  } text-[#fff]`}
                >
                  {isLoading ? 'Encrypting...' : 'Encrypt BlakQube'}
                </button>
              </form>
            ) : null}

            {uploadType === 'agent' ? (
              <form onSubmit={handleAgentProfileMint}>
                {/* MetaQube Section */}
                <div className="bg-[#f6f6f6] p-6 rounded-lg">
                  <div className="flex items-center mb-[10px]">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-[10px] text-blue-500">
                      <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
                    </svg>
                    <h3 className="font-bold text-[18px]">MetaQube</h3>
                  </div>

                  {/* First row - 2 items */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 mb-2">
                        iQube Identifier
                      </label>
                      <input
                        type="text"
                        value={agentProfile.metaQube.iQubeIdentifier}
                        onChange={(e) =>
                          handleAgentProfileChange(
                            'metaQube',
                            'iQubeIdentifier',
                            e.target.value,
                          )
                        }
                        className="w-full p-[10px] border rounded-[5px] bg-[#e8f5e9]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 mb-2">
                        iQube Creator
                      </label>
                      <input
                        type="text"
                        value={agentProfile.metaQube.iQubeCreator}
                        onChange={(e) =>
                          handleAgentProfileChange(
                            'metaQube',
                            'iQubeCreator',
                            e.target.value,
                          )
                        }
                        className="w-full p-[10px] border rounded-[5px] bg-[#e8f5e9]"
                        required
                      />
                    </div>
                  </div>

                  {/* Second row - 2 items */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 mb-2">
                        Owner Type
                      </label>
                      <select
                        value={agentProfile.metaQube.ownerType}
                        onChange={(e) =>
                          handleAgentProfileChange(
                            'metaQube',
                            'ownerType',
                            e.target.value,
                          )
                        }
                        className="w-full p-[10px] border rounded-[5px] bg-[#e8f5e9]"
                        required
                      >
                        <option value="Person">Person</option>
                        <option value="Organisation">Organisation</option>
                        <option value="Thing">Thing</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 mb-2">
                        Content Type
                      </label>
                      <select
                        value={agentProfile.metaQube.iQubeContentType}
                        onChange={(e) =>
                          handleAgentProfileChange(
                            'metaQube',
                            'iQubeContentType',
                            e.target.value,
                          )
                        }
                        className="w-full p-[10px] border rounded-[5px] bg-[#e8f5e9]"
                        required
                      >
                        <option value="mp3">MP3</option>
                        <option value="mp4">MP4</option>
                        <option value="pdf">PDF</option>
                        <option value="txt">TXT</option>
                        <option value="Code">Code</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Third row - 2 items */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 mb-2">
                        Owner Identifiability
                      </label>
                      <select
                        value={agentProfile.metaQube.ownerIdentifiability}
                        onChange={(e) =>
                          handleAgentProfileChange(
                            'metaQube',
                            'ownerIdentifiability',
                            e.target.value,
                          )
                        }
                        className="w-full p-[10px] border rounded-[5px] bg-[#e8f5e9]"
                        required
                      >
                        <option value="Anonymous">Anonymous</option>
                        <option value="Semi-Anonymous">Semi-Anonymous</option>
                        <option value="Identifiable">Identifiable</option>
                        <option value="Semi-Identifiable">Semi-Identifiable</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 mb-2">
                        Transaction Date
                      </label>
                      <input
                        type="date"
                        value={agentProfile.metaQube.transactionDate.split('T')[0]}
                        onChange={(e) =>
                          handleAgentProfileChange(
                            'metaQube',
                            'transactionDate',
                            e.target.value,
                          )
                        }
                        className="w-full p-[10px] border rounded-[5px] bg-[#e8f5e9]"
                        required
                      />
                    </div>
                  </div>

                  {/* Fourth row - 4 scores */}
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 mb-2">
                        Sensitivity Score
                      </label>
                      <select
                        value={agentProfile.metaQube.sensitivityScore}
                        onChange={(e) =>
                          handleAgentProfileChange(
                            'metaQube',
                            'sensitivityScore',
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full p-[10px] border rounded-[5px] bg-[#e8f5e9]"
                        required
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7">7</option>
                        <option value="8">8</option>
                        <option value="9">9</option>
                        <option value="10">10</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 mb-2">
                        Verifiability Score
                      </label>
                      <select
                        value={agentProfile.metaQube.verifiabilityScore}
                        onChange={(e) =>
                          handleAgentProfileChange(
                            'metaQube',
                            'verifiabilityScore',
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full p-[10px] border rounded-[5px] bg-[#e8f5e9]"
                        required
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7">7</option>
                        <option value="8">8</option>
                        <option value="9">9</option>
                        <option value="10">10</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 mb-2">
                        Accuracy Score
                      </label>
                      <select
                        value={agentProfile.metaQube.accuracyScore}
                        onChange={(e) =>
                          handleAgentProfileChange(
                            'metaQube',
                            'accuracyScore',
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full p-[10px] border rounded-[5px] bg-[#e8f5e9]"
                        required
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7">7</option>
                        <option value="8">8</option>
                        <option value="9">9</option>
                        <option value="10">10</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 mb-2">
                        Risk Score
                      </label>
                      <select
                        value={agentProfile.metaQube.riskScore}
                        onChange={(e) =>
                          handleAgentProfileChange(
                            'metaQube',
                            'riskScore',
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full p-[10px] border rounded-[5px] bg-[#e8f5e9]"
                        required
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7">7</option>
                        <option value="8">8</option>
                        <option value="9">9</option>
                        <option value="10">10</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* BlakQube Section */}
                <div className="bg-[#f6f6f6] p-6 rounded-lg mt-6">
                  <div className="flex items-center mb-[10px]">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-[10px] text-red-500">
                      <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
                    </svg>
                    <h3 className="font-bold text-[18px]">BlakQube</h3>
                  </div>

                  {/* Basic Information */}
                  <div className="mb-6">
                    <h4 className="text-[14px] font-semibold text-gray-700 mb-3 border-b pb-2">Basic Information</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {['agentName', 'agentVersion', 'agentType', 'agentCapabilities', 'agentLanguages', 'agentFrameworks'].map((key) => (
                        <div key={key} className="mb-[10px]">
                          <label className="block text-[10px] font-[500] text-[grey]">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </label>
                          <input
                            type="text"
                            value={Array.isArray(agentProfile.blakQube[key]) 
                              ? agentProfile.blakQube[key].join(', ')
                              : agentProfile.blakQube[key]}
                            onChange={(e) => handleAgentProfileChange('blakQube', key, e.target.value)}
                            className="w-[95%] border rounded-[5px] p-[10px] bg-[#ffebee]"
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="mb-6">
                    <h4 className="text-[14px] font-semibold text-gray-700 mb-3 border-b pb-2">Performance Metrics</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {['latencyPerToolCall', 'apiCallFrequency', 'contextWindowUtilization', 'llmCallErrorRate', 
                        'taskCompletionTime', 'memoryUsage', 'responseAccuracy'].map((key) => (
                        <div key={key} className="mb-[10px]">
                          <label className="block text-[10px] font-[500] text-[grey]">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </label>
                          <input
                            type="text"
                            value={agentProfile.blakQube[key]}
                            onChange={(e) => handleAgentProfileChange('blakQube', key, e.target.value)}
                            className="w-[95%] border rounded-[5px] p-[10px] bg-[#ffebee]"
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Identification */}
                  <div className="mb-6">
                    <h4 className="text-[14px] font-semibold text-gray-700 mb-3 border-b pb-2">Identification</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {['agentQubeId', 'summaryDescription', 'uniqueIdentifier'].map((key) => (
                        <div key={key} className="mb-[10px]">
                          <label className="block text-[10px] font-[500] text-[grey]">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </label>
                          <input
                            type="text"
                            value={agentProfile.blakQube[key]}
                            onChange={(e) => handleAgentProfileChange('blakQube', key, e.target.value)}
                            className="w-[95%] border rounded-[5px] p-[10px] bg-[#ffebee]"
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ABI Details */}
                  <div className="mb-6">
                    <h4 className="text-[14px] font-semibold text-gray-700 mb-3 border-b pb-2">ABI Details</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {['abiServicesMenu', 'abiQueryMethod', 'abiInputIQubes', 'abiUsageIQubes', 
                        'abiOutputIQubes', 'abiFunctionManifest', 'abiSystemPrompting', 'abiModelRequirements'].map((key) => (
                        <div key={key} className="mb-[10px]">
                          <label className="block text-[10px] font-[500] text-[grey]">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </label>
                          <input
                            type="text"
                            value={Array.isArray(agentProfile.blakQube[key]) 
                              ? agentProfile.blakQube[key].join(', ')
                              : agentProfile.blakQube[key]}
                            onChange={(e) => handleAgentProfileChange('blakQube', key, e.target.value)}
                            className="w-[95%] border rounded-[5px] p-[10px] bg-[#ffebee]"
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ownership and Training */}
                  <div className="mb-6">
                    <h4 className="text-[14px] font-semibold text-gray-700 mb-3 border-b pb-2">Ownership and Training</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {['agentIpOwnership', 'trainingDatasets', 'verifiableTransactions', 'agentInstanceOwner',
                        'agentWalletPublicKey', 'agentWeights', 'agentBiases', 'agentWalletBalance'].map((key) => (
                        <div key={key} className="mb-[10px]">
                          <label className="block text-[10px] font-[500] text-[grey]">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </label>
                          <input
                            type="text"
                            value={agentProfile.blakQube[key]}
                            onChange={(e) => handleAgentProfileChange('blakQube', key, e.target.value)}
                            className="w-[95%] border rounded-[5px] p-[10px] bg-[#ffebee]"
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Resource Metrics */}
                  <div className="mb-6">
                    <h4 className="text-[14px] font-semibold text-gray-700 mb-3 border-b pb-2">Resource Metrics</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {['tokenUsagePerInteraction', 'energyConsumption', 'resourceUtilizationEfficiency',
                        'roiMetrics', 'scalabilityIndicators'].map((key) => (
                        <div key={key} className="mb-[10px]">
                          <label className="block text-[10px] font-[500] text-[grey]">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </label>
                          <input
                            type="text"
                            value={agentProfile.blakQube[key]}
                            onChange={(e) => handleAgentProfileChange('blakQube', key, e.target.value)}
                            className="w-[95%] border rounded-[5px] p-[10px] bg-[#ffebee]"
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quality Metrics */}
                  <div className="mb-6">
                    <h4 className="text-[14px] font-semibold text-gray-700 mb-3 border-b pb-2">Quality Metrics</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {['instructionAdherence', 'hallucinationRate', 'outputFormatSuccessRate', 'contextAdherence',
                        'errorDisparity', 'systemUptime', 'errorRecoveryRate', 'codeQualityMetrics',
                        'testCoverage', 'bugDetectionRate', 'documentationQuality'].map((key) => (
                        <div key={key} className="mb-[10px]">
                          <label className="block text-[10px] font-[500] text-[grey]">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </label>
                          <input
                            type="text"
                            value={agentProfile.blakQube[key]}
                            onChange={(e) => handleAgentProfileChange('blakQube', key, e.target.value)}
                            className="w-[95%] border rounded-[5px] p-[10px] bg-[#ffebee]"
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* User Experience Metrics */}
                  <div className="mb-6">
                    <h4 className="text-[14px] font-semibold text-gray-700 mb-3 border-b pb-2">User Experience Metrics</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {['agentSuccessRate', 'eventRecallAccuracy', 'agentWaitTime', 'taskCompletionRate',
                        'humanRequestRate', 'stepsPerTask', 'toolSelectionAccuracy', 'userSatisfactionScore',
                        'responseTimeSatisfaction', 'interactionQuality', 'featureAdoptionRate', 'userRetention'].map((key) => (
                        <div key={key} className="mb-[10px]">
                          <label className="block text-[10px] font-[500] text-[grey]">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </label>
                          <input
                            type="text"
                            value={agentProfile.blakQube[key]}
                            onChange={(e) => handleAgentProfileChange('blakQube', key, e.target.value)}
                            className="w-[95%] border rounded-[5px] p-[10px] bg-[#ffebee]"
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  disabled={isLoading}
                  className={`w-full p-[10px] rounded-[5px] ${
                    isLoading ? 'bg-[grey]' : 'bg-[blue]'
                  } text-[#fff]`}
                >
                  {isLoading ? 'Encrypting...' : 'Encrypt BlakQube'}
                </button>
              </form>
            ) : null}

          </div>

          {/* Right Section - TokenQube Operations */}
          <div className="w-[50%] pl-[20px]">
            <h1 className="font-bold text-[28px] mb-[20px]">TokenQube Operations</h1>
            <hr className="w-[20%] mb-[20px]" />
            <div className="flex my-[20px]">
              <div
                className={`${
                  uploadType === 'crosschain' ? 'border-b border-b-[blue]' : ''
                } mr-[10px] cursor-pointer flex items-center pb-[10px]`}
                onClick={() => handleToggle('crosschain')}
              >
                <Send color="blue" className="mr-[10px]" />
                <h5 className={`text-[blue] text-[12px]`}>Qube Transfer</h5>
              </div>
            </div>
            {uploadType === 'crosschain' && <Web3CrossChain />}
            <div className="bg-white border rounded-[10px] p-[30px] w-full">
              <div className="flex items-center mb-[10px]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-[10px] text-blue-500">
                  <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
                </svg>
                <h3 className="font-bold text-[18px]">TokenQube</h3>
              </div>

              {/* Four-button Grid Layout */}
              <div className="grid grid-cols-2 gap-4">
                {/* Token ID Input */}
                <div className="bg-white border rounded-[10px] p-[20px] flex flex-col justify-between">
                  <input
                    type="text"
                    placeholder="Enter Token ID"
                    value={tokenId}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setTokenId(newValue);
                      if (!newValue) {
                        setMetaQubeData(null);
                        setBlakQubeData(null);
                      }
                    }}
                    disabled={isLoading}
                    className="w-full border rounded-[5px] p-[10px]"
                  />
                </div>

                {/* Mint iQube Button */}
                <div className="bg-white border rounded-[10px] p-[20px] flex flex-col justify-between">
                  <button
                    onClick={() => handleMint({})}
                    disabled={isLoading || !selectedFile || !nftInterface || tokenId}
                    className={`w-full py-[10px] rounded-[5px] ${
                      isLoading || !selectedFile || !nftInterface || tokenId ? 'bg-[grey]' : 'bg-[blue]'
                    } text-[#fff]`}
                  >
                    {isLoading ? 'Minting...' : 'Mint iQube'}
                  </button>
                </div>

                {/* Get Metadata Button */}
                <div className="bg-white border rounded-[10px] p-[20px] flex flex-col justify-between">
                  <button
                    onClick={handleRetrieveMetadata}
                    disabled={isLoading || !tokenId || !nftInterface}
                    className={`w-full py-[10px] rounded-[5px] ${
                      isLoading || !tokenId || !nftInterface ? 'bg-[grey]' : 'bg-[blue]'
                    } text-[#fff]`}
                  >
                    {isLoading ? 'Retrieving...' : 'View MetaQube'}
                  </button>
                </div>

                {/* Decrypt BlakQube Button */}
                <div className="bg-white border rounded-[10px] p-[20px] flex flex-col justify-between">
                  <button
                    onClick={handleMemberDataDecryption}
                    disabled={isLoading || !tokenId || !nftInterface}
                    className={`w-full py-[10px] rounded-[5px] ${
                      isLoading || !tokenId || !nftInterface
                        ? 'bg-[grey]'
                        : 'bg-[blue] hover:bg-[#1a8f3c]'
                    } text-[#fff]`}
                  >
                    {isLoading ? 'Decrypting...' : 'Decrypt BlakQube'}
                  </button>
                </div>
              </div>
            </div>

            {/* Qube Data Display */}
            {tokenId && (metaQubeData || blakQubeData) && (
              <div className="mt-6 space-y-6">
                {/* MetaQube Data */}
                {metaQubeData && (
                  <div className="bg-[#f6f6f6] p-6 rounded-lg">
                    <h3 className="font-bold text-[18px] mb-4">MetaQube Data</h3>
                    <div className="space-y-4">
                      {/* First row - 2 items: iQube Identifier and iQube Creator */}
                      <div className="grid grid-cols-2 gap-4">
                        {['iQubeIdentifier', 'iQubeCreator'].map((key) => (
                          <div key={key} className="flex flex-col">
                            <label className="text-[14px] font-medium text-gray-700 mb-2">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </label>
                            <div className="relative group">
                              <div className="bg-[#e8f5e9] p-4 rounded-[5px] shadow-sm min-h-[45px] flex items-center">
                                <span className="text-[14px] text-gray-600 truncate">
                                  {metaQubeData[key]}
                                </span>
                              </div>
                              {typeof metaQubeData[key] === 'string' && metaQubeData[key].length > 40 && (
                                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50">
                                  <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg max-w-[300px] break-all">
                                    <div className="text-sm">{metaQubeData[key]}</div>
                                    <div className="absolute left-4 bottom-[-6px] w-3 h-3 bg-gray-900 transform rotate-45"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Second row - 2 items: Owner Type and Content Type */}
                      <div className="grid grid-cols-2 gap-4">
                        {['ownerType', 'iQubeContentType'].map((key) => (
                          <div key={key} className="flex flex-col">
                            <label className="text-[14px] font-medium text-gray-700 mb-2">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </label>
                            <div className="relative group">
                              <div className="bg-[#e8f5e9] p-4 rounded-[5px] shadow-sm min-h-[45px] flex items-center">
                                <span className="text-[14px] text-gray-600 truncate">
                                  {metaQubeData[key]}
                                </span>
                              </div>
                              {typeof metaQubeData[key] === 'string' && metaQubeData[key].length > 40 && (
                                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50">
                                  <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg max-w-[300px] break-all">
                                    <div className="text-sm">{metaQubeData[key]}</div>
                                    <div className="absolute left-4 bottom-[-6px] w-3 h-3 bg-gray-900 transform rotate-45"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Third row - 2 items: Owner Identifiability and Transaction Date */}
                      <div className="grid grid-cols-2 gap-4">
                        {['ownerIdentifiability', 'transactionDate'].map((key) => (
                          <div key={key} className="flex flex-col">
                            <label className="text-[14px] font-medium text-gray-700 mb-2">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </label>
                            <div className="relative group">
                              <div className="bg-[#e8f5e9] p-4 rounded-[5px] shadow-sm min-h-[45px] flex items-center">
                                <span className="text-[14px] text-gray-600 truncate">
                                  {metaQubeData[key]}
                                </span>
                              </div>
                              {typeof metaQubeData[key] === 'string' && metaQubeData[key].length > 40 && (
                                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50">
                                  <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg max-w-[300px] break-all">
                                    <div className="text-sm">{metaQubeData[key]}</div>
                                    <div className="absolute left-4 bottom-[-6px] w-3 h-3 bg-gray-900 transform rotate-45"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Fourth row - 4 scores */}
                      <div className="grid grid-cols-4 gap-4">
                        {['sensitivityScore', 'verifiabilityScore', 'accuracyScore', 'riskScore'].map((key) => (
                          <div key={key} className="flex flex-col">
                            <label className="text-[14px] font-medium text-gray-700 mb-2">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </label>
                            <div className="relative group">
                              <div className="bg-[#e8f5e9] p-4 rounded-[5px] shadow-sm min-h-[45px] flex items-center">
                                <span className="text-[14px] text-gray-600 truncate">
                                  {metaQubeData[key]}
                                </span>
                              </div>
                              {typeof metaQubeData[key] === 'string' && metaQubeData[key].length > 40 && (
                                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50">
                                  <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg max-w-[300px] break-all">
                                    <div className="text-sm">{metaQubeData[key]}</div>
                                    <div className="absolute left-4 bottom-[-6px] w-3 h-3 bg-gray-900 transform rotate-45"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {/* BlakQube Data */}
                {blakQubeData && (
                  <div className="bg-[#f6f6f6] p-6 rounded-lg">
                    <h3 className="font-bold text-[18px] mb-4">BlakQube Data (Decrypted)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(blakQubeData).map(([key, value]) => (
                        <div key={key} className="flex flex-col">
                          <label className="text-[14px] font-medium text-gray-700 mb-2">
                            {labelMapping[key] || key}
                          </label>
                          <div className="relative group">
                            <div className="bg-[#e8f5e9] p-4 rounded-[5px] shadow-sm min-h-[45px] flex items-center">
                              <span className="text-[14px] text-gray-600 truncate">
                                {value}
                              </span>
                            </div>
                            {typeof value === 'string' && value.length > 40 && (
                              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50">
                                <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg max-w-[300px] break-all">
                                  <div className="text-sm">{value}</div>
                                  <div className="absolute left-4 bottom-[-6px] w-3 h-3 bg-gray-900 transform rotate-45"></div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Encrypted BlakQube Data */}
                {encryptedBlakQubeData && !blakQubeData && (
                  <div className="bg-[#f6f6f6] p-6 rounded-lg">
                    <h3 className="font-bold text-[18px] mb-4">BlakQube Data (Encrypted)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(encryptedBlakQubeData).map(([key, value]) => (
                        <div key={key} className="flex flex-col">
                          <label className="text-[14px] font-medium text-gray-700 mb-2">
                            {labelMapping[key] || key}
                          </label>
                          <div className="relative group">
                            <div className="bg-[#ffebee] p-4 rounded-[5px] shadow-sm min-h-[45px] flex items-center">
                              <span className="text-[14px] text-gray-600 truncate">
                                {value}
                              </span>
                            </div>
                            {typeof value === 'string' && value.length > 40 && (
                              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50">
                                <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg max-w-[300px] break-all">
                                  <div className="text-sm">{value}</div>
                                  <div className="absolute left-4 bottom-[-6px] w-3 h-3 bg-gray-900 transform rotate-45"></div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default IQubeNFTMinter
