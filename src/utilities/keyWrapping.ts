/**
 * Wrap DEK (Data Encryption Key) with minter's MetaMask encryption public key.
 * Uses x25519-xsalsa20-poly1305 (MetaMask eth_getEncryptionPublicKey / eth_decrypt).
 */
import { encrypt } from "@metamask/eth-sig-util/encryption";

const ENCRYPTION_VERSION = "x25519-xsalsa20-poly1305";

/** Get encryption public key from MetaMask for the given address */
export async function getEncryptionPublicKey(address: string): Promise<string> {
  const ethereum = (window as unknown as { ethereum?: { request: (args: unknown) => Promise<unknown> } })
    .ethereum;
  if (!ethereum) throw new Error("Wallet not available");
  const pubKey = await ethereum.request({
    method: "eth_getEncryptionPublicKey",
    params: [address],
  });
  if (typeof pubKey !== "string") throw new Error("Invalid encryption public key");
  return pubKey;
}

/** Wrap DEK (hex string) with minter's public key. Returns JSON string for storage. */
export function wrapDek(dekHex: string, encryptionPublicKey: string): string {
  const encrypted = encrypt({
    publicKey: encryptionPublicKey,
    data: dekHex,
    version: ENCRYPTION_VERSION,
  });
  return JSON.stringify(encrypted);
}

/** Unwrap DEK using MetaMask eth_decrypt. Returns the original DEK hex string. */
export async function unwrapDek(wrappedKeyJson: string, address: string): Promise<string> {
  const ethereum = (window as unknown as { ethereum?: { request: (args: unknown) => Promise<unknown> } })
    .ethereum;
  if (!ethereum) throw new Error("Wallet not available");
  const decrypted = await ethereum.request({
    method: "eth_decrypt",
    params: [wrappedKeyJson, address],
  });
  if (typeof decrypted !== "string") throw new Error("Decryption failed");
  return decrypted;
}
