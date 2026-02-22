import React, { useState } from 'react';
import { pinata } from '../../utilities/pinata-config';
import PolygonNFTInterface from '../../utilities/MetaContract';
import axios from 'axios';

interface MetadataFields {
  iQubeIdentifier: string;
  iQubeCreator: string;
  ownerType: 'Person' | 'Organisation' | 'Thing';
  iQubeContentType: 'mp3' | 'mp4' | 'pdf' | 'txt' | 'Code' | 'Other';
  ownerIdentifiability: 'Anonymous' | 'Semi-Anonymous' | 'Identifiable' | 'Semi-Identifiable';
  transactionDate: string;
  sensitivityScore: number;
  verifiabilityScore: number;
  accuracyScore: number;
  riskScore: number;
}

interface BlakQubeFields {
  format?: string;
  episode?: string;
  version?: string;
  rarity?: string;
  serialNumber?: string;
  specificTraits?: string;
  payloadFile?: string;
  currentOwner?: string;
  updatableData?: string;
}

interface ContentQubeProps {
  nftInterface: PolygonNFTInterface;
  onContentChange?: (content: any) => void;
}

const ContentQube: React.FC<ContentQubeProps> = ({ nftInterface, onContentChange }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenId, setTokenId] = useState<string | null>(null);
  
  // State for BlakQube structured data
  const [blakQubeData, setBlakQubeData] = useState<BlakQubeFields>({
    format: '',
    episode: '',
    version: '',
    rarity: '',
    serialNumber: '',
    specificTraits: '',
    payloadFile: '',
    currentOwner: '',
    updatableData: ''
  });

  // State for MetaQube data
  const [metaQubeData, setMetaQubeData] = useState<MetadataFields>({
    iQubeIdentifier: '',
    iQubeCreator: '',
    ownerType: 'Person',
    iQubeContentType: 'Other',
    ownerIdentifiability: 'Semi-Anonymous',
    transactionDate: new Date().toISOString(),
    sensitivityScore: 5,
    verifiabilityScore: 5,
    accuracyScore: 5,
    riskScore: 5
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create file preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBlakQubeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBlakQubeData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMetaQubeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLDataElement>) => {
    const { name, value } = e.target;
    
    // For numeric fields, ensure value is between 1 and 10
    if (
      name === 'sensitivityScore' || 
      name === 'verifiabilityScore' || 
      name === 'accuracyScore' || 
      name === 'riskScore'
    ) {
      const numValue = Number(value);
      const clampedValue = Math.min(Math.max(numValue, 1), 10);
      
      setMetaQubeData(prev => ({
        ...prev,
        [name]: clampedValue
      }));
      return;
    }
    
    // For other fields, proceed as normal
    setMetaQubeData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMint = async () => {
    if (!selectedFile) {
      setError('Please select a file to mint');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Upload file to IPFS
      const fileUpload = await pinata.upload.file(selectedFile);

      // Prepare metadata
      const metaQube: MetadataFields = {
        ...metaQubeData,
        iQubeIdentifier: `ContentQube-${Date.now()}`,
        iQubeContentType: selectedFile.type.includes('image') ? 'Other' : 
                          selectedFile.type.includes('video') ? 'mp4' :
                          selectedFile.type.includes('audio') ? 'mp3' :
                          selectedFile.type.includes('pdf') ? 'pdf' :
                          selectedFile.type.includes('text') ? 'txt' : 'Other',
      };

      // Prepare encrypted content data
      const contentQubeData = {
        metaQube,
        blakQube: {
          ...blakQubeData,
          blobFile: selectedFile,
          blobPreview: filePreview,
          encryptedFileHash: fileUpload.IpfsHash,
        }
      };

      // Encrypt the content
      const encryptedFile = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/encrypt-file`, 
        { file: fileUpload.IpfsHash }
      );

      // Encrypt BlakQube data
      const encryptedBlakQube = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/encrypt-data`,
        {
          ...contentQubeData.blakQube,
          blobFile: null,
          blobPreview: null,
          encryptedFileHash: fileUpload.IpfsHash,
          encryptedFileKey: encryptedFile.data.key
        }
      );

      if (!encryptedBlakQube.data.success) {
        throw new Error('Failed to encrypt BlakQube data');
      }

      // Create metadata
      const metadata = JSON.stringify({
        name: `ContentQube NFT #${Date.now()}`,
        description: 'An encrypted ContentQube NFT',
        image: encryptedFile.data,
        attributes: [
          { trait_type: 'metaQube', value: contentQubeData.metaQube },
          { trait_type: 'blakQube', value: encryptedBlakQube.data.encryptedData.blakQube }
        ],
      });

      // Upload metadata to IPFS
      const metadataUpload = await pinata.upload.json(JSON.parse(metadata));

      // Mint NFT
      const receipt = await nftInterface.mintQube(
        `ipfs://${metadataUpload.IpfsHash}`,
        encryptedBlakQube.data.encryptedData.key
      );

      const newTokenId = await nftInterface.getTokenIdFromReceipt(receipt);
      if (newTokenId) {
        setTokenId(newTokenId);
        console.log('NFT minted successfully with token ID:', newTokenId);
        
        // Call onContentChange if provided
        if (onContentChange) {
          onContentChange({
            metaQube,
            blakQube: {
              ...contentQubeData.blakQube,
              encryptedFileKey: encryptedFile.data.key,
              tokenId: newTokenId
            }
          });
        }
      } else {
        console.log("NFT minted successfully, but couldn't retrieve token ID");
      }
    } catch (error) {
      console.error('Error minting NFT:', error);
      setError(String(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      
      {/* MetaQube Data Section */}
      <div className="mb-4 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-2 text-green-500">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.59c-.63-.63-.18-1.71.63-1.71H16c.63 0 1.17.46 1.17 1.17v1.17c0 .63-.46 1.17-1.17 1.17H9.41c-.63 0-1.17-.46-1.17-1.17v-.63c.63-.63 1.71-.18 1.71.63l2.59 2.59z" />
          </svg>
          MetaQube
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {/* First Row: iQube Identifier and iQube Creator */}
          <div className="flex flex-col">
            <label htmlFor="iQubeIdentifier" className="text-sm mb-1 text-black">iQube Identifier</label>
            <input 
              id="iQubeIdentifier"
              type="text" 
              name="iQubeIdentifier"
              placeholder="Enter iQube Identifier"
              value={metaQubeData.iQubeIdentifier}
              onChange={handleMetaQubeChange}
              className="border p-2 bg-green-50"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="iQubeCreator" className="text-sm mb-1 text-black">iQube Creator</label>
            <input 
              id="iQubeCreator"
              type="text" 
              name="iQubeCreator"
              placeholder="Enter iQube Creator"
              value={metaQubeData.iQubeCreator}
              onChange={handleMetaQubeChange}
              className="border p-2 bg-green-50"
            />
          </div>

          {/* Second Row: Owner Type and Owner Identifiability */}
          <div className="flex flex-col">
            <label htmlFor="ownerType" className="text-sm mb-1 text-black">Owner Type</label>
            <select 
              id="ownerType"
              name="ownerType"
              value={metaQubeData.ownerType}
              onChange={handleMetaQubeChange}
              className="border p-2 bg-green-50"
            >
              <option value="Person">Person</option>
              <option value="Organisation">Organisation</option>
              <option value="Thing">Thing</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor="ownerIdentifiability" className="text-sm mb-1 text-black">Owner Identifiability</label>
            <select 
              id="ownerIdentifiability"
              name="ownerIdentifiability"
              value={metaQubeData.ownerIdentifiability}
              onChange={handleMetaQubeChange}
              className="border p-2 bg-green-50"
            >
              <option value="Anonymous">Anonymous</option>
              <option value="Semi-Anonymous">Semi-Anonymous</option>
              <option value="Identifiable">Identifiable</option>
              <option value="Semi-Identifiable">Semi-Identifiable</option>
            </select>
          </div>

          {/* Third Row: Content Type and Transaction Date */}
          <div className="flex flex-col">
            <label htmlFor="iQubeContentType" className="text-sm mb-1 text-black">Content Type</label>
            <select 
              id="iQubeContentType"
              name="iQubeContentType"
              value={metaQubeData.iQubeContentType}
              onChange={handleMetaQubeChange}
              className="border p-2 bg-green-50"
            >
              <option value="mp3">mp3</option>
              <option value="mp4">mp4</option>
              <option value="pdf">pdf</option>
              <option value="txt">txt</option>
              <option value="Code">Code</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor="transactionDate" className="text-sm mb-1 text-black">Transaction Date</label>
            <input 
              id="transactionDate"
              type="date" 
              name="transactionDate"
              value={metaQubeData.transactionDate}
              onChange={handleMetaQubeChange}
              className="border p-2 bg-green-50"
            />
          </div>

          {/* Fourth Row: All Four Scores */}
          <div className="flex flex-col col-span-2 grid grid-cols-4 gap-4">
            <div className="flex flex-col">
              <label htmlFor="sensitivityScore" className="text-sm mb-1 text-black">Sensitivity</label>
              <input 
                id="sensitivityScore"
                type="number" 
                name="sensitivityScore"
                placeholder="Enter Sensitivity"
                value={metaQubeData.sensitivityScore}
                onChange={handleMetaQubeChange}
                min="1"
                max="10"
                className="border p-2 bg-green-50"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="verifiabilityScore" className="text-sm mb-1 text-black">Verifiability</label>
              <input 
                id="verifiabilityScore"
                type="number" 
                name="verifiabilityScore"
                placeholder="Enter Verifiability"
                value={metaQubeData.verifiabilityScore}
                onChange={handleMetaQubeChange}
                min="1"
                max="10"
                className="border p-2 bg-green-50"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="accuracyScore" className="text-sm mb-1 text-black">Accuracy</label>
              <input 
                id="accuracyScore"
                type="number" 
                name="accuracyScore"
                placeholder="Enter Accuracy"
                value={metaQubeData.accuracyScore}
                onChange={handleMetaQubeChange}
                min="1"
                max="10"
                className="border p-2 bg-green-50"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="riskScore" className="text-sm mb-1 text-black">Risk</label>
              <input 
                id="riskScore"
                type="number" 
                name="riskScore"
                placeholder="Enter Risk"
                value={metaQubeData.riskScore}
                onChange={handleMetaQubeChange}
                min="1"
                max="10"
                className="border p-2 bg-green-50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* BlakQube Structured Data Section */}
      <div className="mb-4 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-2 text-red-500">
            <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
          </svg>
          BlakQube
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label htmlFor="format" className="text-sm mb-1 text-black">Format</label>
            <input 
              id="format"
              type="text" 
              name="format"
              placeholder="Enter Format"
              value={blakQubeData.format}
              onChange={handleBlakQubeChange}
              className="border p-2 bg-red-50"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="episode" className="text-sm mb-1 text-black">Episode</label>
            <input 
              id="episode"
              type="text" 
              name="episode"
              placeholder="Enter Episode"
              value={blakQubeData.episode}
              onChange={handleBlakQubeChange}
              className="border p-2 bg-red-50"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="version" className="text-sm mb-1 text-black">Version</label>
            <input 
              id="version"
              type="text" 
              name="version"
              placeholder="Enter Version"
              value={blakQubeData.version}
              onChange={handleBlakQubeChange}
              className="border p-2 bg-red-50"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="rarity" className="text-sm mb-1 text-black">Rarity</label>
            <input 
              id="rarity"
              type="text" 
              name="rarity"
              placeholder="Enter Rarity"
              value={blakQubeData.rarity}
              onChange={handleBlakQubeChange}
              className="border p-2 bg-red-50"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="serialNumber" className="text-sm mb-1 text-black">Serial Number</label>
            <input 
              id="serialNumber"
              type="text" 
              name="serialNumber"
              placeholder="Enter Serial Number"
              value={blakQubeData.serialNumber}
              onChange={handleBlakQubeChange}
              className="border p-2 bg-red-50"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="specificTraits" className="text-sm mb-1 text-black">Specific Traits</label>
            <input 
              id="specificTraits"
              type="text" 
              name="specificTraits"
              placeholder="Enter Specific Traits"
              value={blakQubeData.specificTraits}
              onChange={handleBlakQubeChange}
              className="border p-2 bg-red-50"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="payloadFile" className="text-sm mb-1 text-black">Payload File</label>
            <input 
              id="payloadFile"
              type="text" 
              name="payloadFile"
              placeholder="Enter Payload File"
              value={blakQubeData.payloadFile}
              onChange={handleBlakQubeChange}
              className="border p-2 bg-red-50"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="currentOwner" className="text-sm mb-1 text-black">Current Owner</label>
            <input 
              id="currentOwner"
              type="text" 
              name="currentOwner"
              placeholder="Enter Current Owner"
              value={blakQubeData.currentOwner}
              onChange={handleBlakQubeChange}
              className="border p-2 bg-red-50"
            />
          </div>
          <div className="flex flex-col col-span-2">
            <label htmlFor="updatableData" className="text-sm mb-1 text-black">Updatable Data</label>
            <input 
              id="updatableData"
              type="text" 
              name="updatableData"
              placeholder="Enter Updatable Data"
              value={blakQubeData.updatableData}
              onChange={handleBlakQubeChange}
              className="border p-2 bg-red-50"
            />
          </div>
        </div>
      </div>

      {/* File Upload Section */}
      <div className="mb-4 p-4 bg-gray-100 rounded-lg">
        <label className="block text-sm font-medium text-gray-700">Upload File</label>
        <input 
          type="file" 
          onChange={handleFileUpload}
          className="mt-1 block w-full bg-red-50"
        />
        {filePreview && (
          <div className="mt-2">
            <img 
              src={filePreview} 
              alt="File Preview" 
              className="max-h-96 w-full object-contain"
            />
          </div>
        )}
      </div>

      {/* Mint Button */}
      <button 
        type="submit" 
        disabled={isLoading || !selectedFile}
        className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors duration-300"
        onClick={handleMint}
      >
        {isLoading ? 'Encrypting...' : 'Encrypt BlakQube'}
      </button>

      {/* Error and Token ID Display */}
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {tokenId && <p className="text-green-500 mt-2">Minted Token ID: {tokenId}</p>}
    </div>
  );
};

export default ContentQube;
