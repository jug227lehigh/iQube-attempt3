import {
 getContract,
 createThirdwebClient,
 prepareContractCall,
} from "thirdweb";
import { polygonAmoy } from "thirdweb/chains";
import {
 useReadContract,
 useSendTransaction,
 useActiveAccount,
} from "thirdweb/react";
import constants from "./constants";

const client = createThirdwebClient({
 clientId: "8dc8e3e2452cdf667e0452a5be2906e7",
});

export const contract = getContract({
 client,
 address: constants.AMOY,
 chain: polygonAmoy,
});

export const useMetaQubeLocation = (tokenId: any) => {
 return useReadContract({
  contract,
  method: "function getMetaQubeLocation(uint256 tokenId) view returns (string)",
  params: [BigInt(tokenId)],
 });
};

export const useMintQube = (metaQubeLocation: any, encryptionKey: any) => {
 const {
  mutate: sendTx,
  data: transactionResult,
  error: transactionError,
 } = useSendTransaction();
 console.log("encryptionKey => ", encryptionKey);

 if (!metaQubeLocation || !encryptionKey)
  return {
   mintQube: () => {},
   transactionResult: null,
   transactionError: null,
  };

 const mintQube = () => {
  const transaction = prepareContractCall({
   contract,
   method: "function mintQube(string memory uri, string memory encryptionKey)",
   params: [metaQubeLocation, encryptionKey],
  });
  sendTx(transaction);
 };

 console.log("transactionResult => ", transactionResult);
 return { mintQube, transactionResult, transactionError };
};

export const useGetEncryptionKey = (tokenId: any) => {
 try {
  console.log("tokenId => ", tokenId);
  const {
   mutate: sendTx,
   data: encTxData,
   error: encTxError,
  } = useSendTransaction();

  const _getEncryptionKey = () => {
   const transaction = prepareContractCall({
    contract,
    method: "function getEncryptionKey(uint256 tokenId) view returns (string)",
    params: [BigInt(tokenId)],
   });

   sendTx(transaction);
  };

  return { _getEncryptionKey, encTxData, encTxError };
 } catch (error) {
  console.log("error => ", error);
  throw error;
 }
};

export const useGetEncryptionKeyII = (tokenId: any) => {
 try {
  const {
   data: _encryptionKey,
   isLoading: encKeyIsLoading,
   error: encKeyError,
  } = useReadContract({
   contract,
   method: "function getEncryptionKey(uint256 tokenId) view returns (string)",
   params: [BigInt(tokenId)],
  });
  return { _encryptionKey, encKeyIsLoading, encKeyError };
 } catch (error) {
  console.log("error => ", error);
 }
};

export const ownerOf = (tokenId: any) => {
 return useReadContract({
  contract,
  method: "function ownerOf(uint256 tokenId) view returns (address)",
  params: [BigInt(tokenId)],
 });
};

export const useTransferQube = (tokenId: any, to: any) => {
 try {
  const {
   mutate: sendTx,
   data: transactionResult,
   error: transactionError,
  } = useSendTransaction();

  const transfer = () => {
   const transaction = prepareContractCall({
    contract,
    method: "function transferQube(address to, uint256 tokenId)",
    params: [to, BigInt(tokenId)],
   });
   console.log("transaction => ", transaction);
   sendTx(transaction);
  };
  return { transfer, transactionResult, transactionError };
 } catch (error) {
  console.log("error => ", error);
 }
};

export const getThirdWebPublicKey = () => {
 const publicKey = useActiveAccount();
 return publicKey?.address;
};
