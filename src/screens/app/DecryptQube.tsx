import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Lock, Unlock, Search, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { useWallet } from "../../context/WalletContext";
import { ownerOf, getMetaQubeLocation } from "../../utilities/contractUtils";
import { supabase, isSupabaseConfigured } from "../../utilities/supabase";
import EncryptionModule from "../../utilities/encryption";
import { unwrapDek } from "../../utilities/keyWrapping";
import Navbar from "../../components/Navbar";

export default function DecryptQube() {
  const { address } = useWallet();
  const [searchParams] = useSearchParams();
  const [tokenId, setTokenId] = useState(searchParams.get("tokenId") ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [decryptedData, setDecryptedData] = useState<Record<string, string> | null>(null);
  const [metadata, setMetadata] = useState<Record<string, unknown> | null>(null);

  const handleDecrypt = async () => {
    if (!address) {
      setError("Please connect your wallet first.");
      return;
    }
    if (!tokenId.trim()) {
      setError("Please enter a token ID.");
      return;
    }
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured. Cannot retrieve wrapped keys.");
      return;
    }

    setIsLoading(true);
    setError("");
    setDecryptedData(null);
    setMetadata(null);

    try {
      // 1. Verify ownership
      const owner = await ownerOf(Number(tokenId));
      if (owner.toLowerCase() !== address.toLowerCase()) {
        setError("You are not the owner of this iQube. Only the owner can decrypt it.");
        return;
      }

      // 2. Fetch metadata from IPFS
      let metaQubeUrl = await getMetaQubeLocation(Number(tokenId));
      // Some on-chain URLs are missing the https:// prefix
      if (metaQubeUrl && !metaQubeUrl.startsWith("http")) {
        metaQubeUrl = `https://${metaQubeUrl}`;
      }
      const metaRes = await fetch(metaQubeUrl);
      if (!metaRes.ok) throw new Error("Failed to fetch metadata from IPFS");
      const meta = await metaRes.json();
      setMetadata(meta);

      // 3. Check if there is encrypted data
      const blakQubeAttr = meta.attributes?.find(
        (a: { trait_type: string; value: unknown }) => a.trait_type === "blakQube"
      );
      const isEncryptedAttr = meta.attributes?.find(
        (a: { trait_type: string; value: unknown }) => a.trait_type === "isEncrypted"
      );

      if (!isEncryptedAttr?.value || !blakQubeAttr?.value) {
        setError("This iQube has no encrypted private data.");
        return;
      }

      // 4. Fetch wrapped key from Supabase
      const { data: keyRow, error: keyErr } = await supabase!
        .from("iqube_wrapped_keys")
        .select("wrapped_key")
        .eq("token_id", Number(tokenId))
        .single();

      if (keyErr || !keyRow) {
        setError("Could not retrieve wrapped key from Supabase. Key may not have been stored.");
        return;
      }

      // 5. Unwrap DEK using MetaMask
      const dekHex = await unwrapDek(keyRow.wrapped_key, address);

      // 6. Parse encrypted blob and decrypt
      const encryptedBlob = JSON.parse(blakQubeAttr.value as string);
      const decrypted = await EncryptionModule.Decrypt({
        iv: encryptedBlob.iv,
        authTag: encryptedBlob.authTag,
        encryptedData: encryptedBlob.encryptedData,
        key: dekHex,
      });

      setDecryptedData(decrypted);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-28 pb-20 px-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Decrypt iQube</h1>
          <p className="text-gray-500 text-base mb-10">
            Enter your token ID to verify ownership and decrypt your private data.
          </p>

          {!address && (
            <div className="mb-8 px-5 py-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
              Connect your wallet to decrypt an iQube.
            </div>
          )}

          {/* Input */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Token ID</label>
            <div className="flex gap-4">
              <input
                type="number"
                min={0}
                value={tokenId}
                onChange={(e) => { setTokenId(e.target.value); setError(""); }}
                placeholder="e.g. 1"
                className="flex-1 px-5 py-4 rounded-xl bg-white border-2 border-gray-200 text-gray-900 placeholder-gray-400 text-base focus:outline-none focus:border-black transition-colors"
              />
              <button
                onClick={handleDecrypt}
                disabled={isLoading || !address}
                className="flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <><Loader2 size={18} className="animate-spin" /> Decrypting…</>
                ) : (
                  <><Search size={18} /> Decrypt</>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-8 flex items-center gap-3 px-5 py-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertTriangle size={18} /> {error}
            </div>
          )}

          {/* Metadata summary */}
          {metadata && (
            <div className="mb-8 rounded-2xl border-2 border-gray-200 divide-y divide-gray-100">
              <div className="px-6 py-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Lock size={16} /> iQube Metadata
              </div>
              {[
                { label: "Name", value: metadata.name },
                { label: "Description", value: metadata.description },
                ...(metadata.attributes as Array<{ trait_type: string; value: unknown }> ?? [])
                  .filter((a) => a.trait_type !== "blakQube")
                  .map((a) => ({ label: a.trait_type, value: String(a.value) })),
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center px-6 py-4">
                  <span className="text-sm text-gray-500">{row.label}</span>
                  <span className="text-sm font-semibold text-gray-900">{String(row.value)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Decrypted data */}
          {decryptedData && (
            <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50">
              <div className="px-6 py-4 flex items-center gap-2 text-sm font-semibold text-emerald-800 border-b border-emerald-200">
                <Unlock size={16} /> Decrypted Private Data
              </div>
              <div className="divide-y divide-emerald-100">
                {Object.entries(decryptedData).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center px-6 py-4">
                    <span className="text-sm text-emerald-700 font-medium">{key}</span>
                    <span className="text-sm font-semibold text-gray-900 font-mono">{value}</span>
                  </div>
                ))}
              </div>
              <div className="px-6 py-3 flex items-center gap-2 text-xs text-emerald-600 border-t border-emerald-200">
                <CheckCircle size={14} /> Decrypted successfully using your MetaMask key.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
