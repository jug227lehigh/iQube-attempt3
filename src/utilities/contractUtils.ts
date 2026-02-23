import {
  createPublicClient,
  createWalletClient,
  http,
  custom,
  type Hash,
  type Address,
} from "viem";
import { polygonAmoy } from "viem/chains";
import constants from "./constants";
import { iqubeAbi } from "./iqubeAbi";

const transport = http(constants.RPC_POLYGON_AMOY);

export const publicClient = createPublicClient({
  transport,
  chain: polygonAmoy,
});

const contractAddress = constants.AMOY as Address;

// ——— Read helpers (no wallet needed) ———

export async function getMetaQubeLocation(tokenId: bigint | number): Promise<string> {
  return publicClient.readContract({
    address: contractAddress,
    abi: iqubeAbi,
    functionName: "getMetaQubeLocation",
    args: [BigInt(tokenId)],
  });
}

export async function getEncryptionKey(tokenId: bigint | number): Promise<string> {
  return publicClient.readContract({
    address: contractAddress,
    abi: iqubeAbi,
    functionName: "getEncryptionKey",
    args: [BigInt(tokenId)],
  });
}

export async function ownerOf(tokenId: bigint | number): Promise<Address> {
  return publicClient.readContract({
    address: contractAddress,
    abi: iqubeAbi,
    functionName: "ownerOf",
    args: [BigInt(tokenId)],
  });
}

function getBrowserProvider(): unknown {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { ethereum?: unknown }).ethereum;
}

// ——— Write helpers (need wallet; call from component with useWallet) ———

export async function mintQube(
  metaQubeLocation: string,
  encryptionKey: string
): Promise<Hash> {
  const provider = getBrowserProvider();
  if (!provider) {
    throw new Error("Wallet not available");
  }
  const walletClient = createWalletClient({
    transport: custom(provider),
    chain: polygonAmoy,
  });
  const [account] = await walletClient.getAddresses();
  if (!account) throw new Error("No account connected");
  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: iqubeAbi,
    functionName: "mintQube",
    args: [metaQubeLocation, encryptionKey],
    account,
  });
  return hash;
}

export async function transferQube(
  to: Address,
  tokenId: bigint | number
): Promise<Hash> {
  const provider = getBrowserProvider();
  if (!provider) {
    throw new Error("Wallet not available");
  }
  const walletClient = createWalletClient({
    transport: custom(provider),
    chain: polygonAmoy,
  });
  const [account] = await walletClient.getAddresses();
  if (!account) throw new Error("No account connected");
  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: iqubeAbi,
    functionName: "transferQube",
    args: [to, BigInt(tokenId)],
    account,
  });
  return hash;
}
