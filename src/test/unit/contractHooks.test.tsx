import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

// ─────────────────────────────────────────────────────────────────────────────
// REQUIREMENTS covered by this file (see docs/TRACEABILITY.md):
//   REQ-HOOK-MINT-001  useMintQube.mintQube() shall set transactionResult on success
//   REQ-HOOK-MINT-002  useMintQube.mintQube() shall set transactionError on failure
//   REQ-HOOK-READ-001  useOwnerOf shall expose loading → data lifecycle
//   REQ-HOOK-READ-002  useOwnerOf shall cancel stale reads on tokenId change
//
// Strategy: mock the contractUtils module so hooks run deterministically
// without a wallet or RPC. We exercise the React state machine of each hook.
// Aerospace analog: this is "unit test of a control-loop wrapper" — the loop
// (the hook) is tested independently of the plant (the blockchain).
// ─────────────────────────────────────────────────────────────────────────────

vi.mock('../../utilities/contractUtils', () => ({
  mintQube: vi.fn(),
  transferQube: vi.fn(),
  getMetaQubeLocation: vi.fn(),
  getEncryptionKey: vi.fn(),
  ownerOf: vi.fn(),
}))

import * as contractUtils from '../../utilities/contractUtils'
import { useMintQube, useOwnerOf } from '../../hooks/contractHooks'

beforeEach(() => {
  vi.mocked(contractUtils.mintQube).mockReset()
  vi.mocked(contractUtils.ownerOf).mockReset()
})

// ─── useMintQube ────────────────────────────────────────────────────────────

describe('REQ-HOOK-MINT-001/002 useMintQube', () => {
  it('sets transactionResult on successful mint', async () => {
    vi.mocked(contractUtils.mintQube).mockResolvedValue('0xaaa')
    const { result } = renderHook(() => useMintQube('ipfs://x', 'key'))

    await act(async () => {
      await result.current.mintQube()
    })

    expect(result.current.transactionResult).toEqual({ transactionHash: '0xaaa' })
    expect(result.current.transactionError).toBeNull()
  })

  it('sets transactionError when mint rejects', async () => {
    vi.mocked(contractUtils.mintQube).mockRejectedValue(new Error('User rejected'))
    const { result } = renderHook(() => useMintQube('ipfs://x', 'key'))

    await act(async () => {
      await result.current.mintQube()
    })

    expect(result.current.transactionError?.message).toMatch(/user rejected/i)
    expect(result.current.transactionResult).toBeNull()
  })

  it('is a no-op when URI or key is null', async () => {
    const { result } = renderHook(() => useMintQube(null, null))
    await act(async () => {
      await result.current.mintQube()
    })
    expect(contractUtils.mintQube).not.toHaveBeenCalled()
  })

  it('allows override of uri/key at call time', async () => {
    vi.mocked(contractUtils.mintQube).mockResolvedValue('0xbbb')
    const { result } = renderHook(() => useMintQube(null, null))
    await act(async () => {
      await result.current.mintQube('ipfs://override', 'override-key')
    })
    expect(contractUtils.mintQube).toHaveBeenCalledWith('ipfs://override', 'override-key')
  })
})

// ─── useOwnerOf — lifecycle + race condition ────────────────────────────────

describe('REQ-HOOK-READ-001 useOwnerOf lifecycle', () => {
  it('starts in loading, resolves to data', async () => {
    vi.mocked(contractUtils.ownerOf).mockResolvedValue('0x0000000000000000000000000000000000000009')
    const { result } = renderHook(() => useOwnerOf(0))
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toBe('0x0000000000000000000000000000000000000009')
    expect(result.current.error).toBeNull()
  })

  it('surfaces read errors', async () => {
    vi.mocked(contractUtils.ownerOf).mockRejectedValue(new Error('nonexistent token'))
    const { result } = renderHook(() => useOwnerOf(999))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error?.message).toMatch(/nonexistent/i)
    expect(result.current.data).toBeNull()
  })
})

describe('REQ-HOOK-READ-002 useOwnerOf cancels stale reads', () => {
  it('does not overwrite newer result with an older slow response', async () => {
    // First tokenId: slow → resolves last with old value
    // Second tokenId: fast → resolves first with new value
    // After both settle, we must see only the NEW value.
    let resolveSlow: (v: string) => void = () => {}
    const slow = new Promise<string>(r => { resolveSlow = r })
    vi.mocked(contractUtils.ownerOf)
      .mockImplementationOnce(() => slow)
      .mockResolvedValueOnce('0x00000000000000000000000000000000000000Fa')

    const { result, rerender } = renderHook(
      ({ id }: { id: number }) => useOwnerOf(id),
      { initialProps: { id: 1 } },
    )
    rerender({ id: 2 })
    await waitFor(() => expect(result.current.data).toBe('0x00000000000000000000000000000000000000Fa'))

    // Now resolve the stale one — it should be ignored.
    await act(async () => {
      resolveSlow('0x0000000000000000000000000000000000000001')
    })
    expect(result.current.data).toBe('0x00000000000000000000000000000000000000Fa')
  })
})
