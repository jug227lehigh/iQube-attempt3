import { useState, useEffect, useCallback } from "react";
import type { Address } from "viem";
import {
  getMetaQubeLocation,
  getEncryptionKey,
  ownerOf as readOwnerOf,
  mintQube as mintQubeTx,
  transferQube as transferQubeTx,
} from "../utilities/contractUtils";

// React hooks that mirror the old Thirdweb hook API so components need minimal changes.

export function useMetaQubeLocation(tokenId: string | number) {
  const [data, setData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (tokenId === "" || tokenId === undefined) {
      setData(null);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setError(null);
    setData(null);
    setIsLoading(true);
    getMetaQubeLocation(Number(tokenId))
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tokenId]);

  return { data, isLoading, error };
}

export function useMintQube(metaQubeLocation: string | null, encryptionKey: string | null) {
  const [transactionResult, setTransactionResult] = useState<{ transactionHash: string } | null>(null);
  const [transactionError, setTransactionError] = useState<Error | null>(null);

  const mintQube = useCallback(
    async (overrideUri?: string, overrideKey?: string) => {
      const uri = overrideUri ?? metaQubeLocation;
      const key = overrideKey ?? encryptionKey;
      if (!uri || !key) return;
      setTransactionError(null);
      setTransactionResult(null);
      try {
        const hash = await mintQubeTx(uri, key);
        setTransactionResult({ transactionHash: hash });
      } catch (err) {
        setTransactionError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [metaQubeLocation, encryptionKey]
  );

  return { mintQube, transactionResult, transactionError };
}

export function useGetEncryptionKeyII(tokenId: string | number) {
  const [_encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [encKeyIsLoading, setEncKeyIsLoading] = useState(true);
  const [encKeyError, setEncKeyError] = useState<Error | null>(null);

  useEffect(() => {
    if (tokenId === "" || tokenId === undefined) {
      setEncryptionKey(null);
      setEncKeyIsLoading(false);
      return;
    }
    let cancelled = false;
    setEncKeyError(null);
    setEncKeyIsLoading(true);
    getEncryptionKey(Number(tokenId))
      .then((res) => {
        if (!cancelled) setEncryptionKey(res);
      })
      .catch((err) => {
        if (!cancelled) setEncKeyError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) setEncKeyIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tokenId]);

  return { _encryptionKey, encKeyIsLoading, encKeyError };
}

export function useOwnerOf(tokenId: string | number) {
  const [data, setData] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (tokenId === "" || tokenId === undefined) {
      setData(null);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setError(null);
    setData(null);
    setIsLoading(true);
    readOwnerOf(Number(tokenId))
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tokenId]);

  return { data, isLoading, error };
}

export function useTransferQube(tokenId: string | number, to: Address | null) {
  const [transactionResult, setTransactionResult] = useState<{ transactionHash: string } | null>(null);
  const [transactionError, setTransactionError] = useState<Error | null>(null);

  const transfer = useCallback(async () => {
    if (to == null || tokenId === "" || tokenId === undefined) return;
    setTransactionError(null);
    setTransactionResult(null);
    try {
      const hash = await transferQubeTx(to, Number(tokenId));
      setTransactionResult({ transactionHash: hash });
    } catch (err) {
      setTransactionError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [to, tokenId]);

  return { transfer, transactionResult, transactionError };
}
