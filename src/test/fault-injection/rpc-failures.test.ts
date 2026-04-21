import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ─────────────────────────────────────────────────────────────────────────────
// Fault-injection tests
//
// REQUIREMENTS covered (see docs/TRACEABILITY.md):
//   REQ-ROBUST-001  UI layer shall surface a user-readable error on RPC timeout
//   REQ-ROBUST-002  UI layer shall surface a user-readable error on user rejection
//   REQ-ROBUST-003  Read hooks shall propagate revert errors without crashing
//   REQ-ROBUST-004  Missing wallet shall not cause silent failure
//
// Aerospace framing: this is robustness / off-nominal testing. In avionics,
// failure modes (sensor dropout, bus timeout, CRC error) must surface as
// annunciations — never silent. Here the equivalent is that the UI layer
// must always produce a legible error string for the user to act on.
// ─────────────────────────────────────────────────────────────────────────────

const writeContract = vi.fn()
const readContract = vi.fn()
const getAddresses = vi.fn()

vi.mock('viem', async () => {
  const actual = await vi.importActual<typeof import('viem')>('viem')
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({ readContract })),
    createWalletClient: vi.fn(() => ({ writeContract, getAddresses })),
    http: vi.fn(() => 'HTTP_TRANSPORT'),
    custom: vi.fn(() => 'CUSTOM_TRANSPORT'),
  }
})

function setEthereum(value: unknown) {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: value === undefined ? undefined : { ethereum: value },
  })
}

beforeEach(() => {
  writeContract.mockReset()
  readContract.mockReset()
  getAddresses.mockReset()
  setEthereum({ isMetaMask: true })
  getAddresses.mockResolvedValue(['0x0000000000000000000000000000000000000001'])
})

afterEach(() => {
  setEthereum({})
})

// ─── Write path faults ──────────────────────────────────────────────────────

describe('REQ-ROBUST-002 user rejection surfaces as legible error', () => {
  it('propagates MetaMask user-rejection error', async () => {
    writeContract.mockRejectedValue(
      Object.assign(new Error('User rejected the request.'), { code: 4001 }),
    )
    const { mintQube } = await import('../../utilities/contractUtils')
    await expect(mintQube('ipfs://x', 'k')).rejects.toMatchObject({
      message: expect.stringMatching(/user rejected/i),
    })
  })
})

describe('REQ-ROBUST-001 RPC timeout surfaces as legible error', () => {
  it('propagates timeout error', async () => {
    writeContract.mockRejectedValue(new Error('HTTP request timed out after 10000ms'))
    const { mintQube } = await import('../../utilities/contractUtils')
    await expect(mintQube('ipfs://x', 'k')).rejects.toThrow(/timed out/i)
  })

  it('propagates 5xx server error', async () => {
    writeContract.mockRejectedValue(new Error('RPC error: 503 Service Unavailable'))
    const { mintQube } = await import('../../utilities/contractUtils')
    await expect(mintQube('ipfs://x', 'k')).rejects.toThrow(/503|service unavailable/i)
  })
})

describe('REQ-ROBUST-004 missing wallet is loud, not silent', () => {
  it('explicit error message when window.ethereum is undefined', async () => {
    setEthereum(undefined)
    const { mintQube } = await import('../../utilities/contractUtils')
    await expect(mintQube('ipfs://x', 'k')).rejects.toThrow(/wallet not available/i)
  })
})

describe('chain mismatch is surfaced', () => {
  it('propagates chain-mismatch error from viem', async () => {
    writeContract.mockRejectedValue(
      new Error('The current chain of the wallet (id: 1) does not match the target chain (id: 80002)'),
    )
    const { mintQube } = await import('../../utilities/contractUtils')
    await expect(mintQube('ipfs://x', 'k')).rejects.toThrow(/chain/i)
  })
})

// ─── Read path faults ───────────────────────────────────────────────────────

describe('REQ-ROBUST-003 read reverts propagate without crashing', () => {
  it('ownerOf on nonexistent token surfaces revert', async () => {
    readContract.mockRejectedValue(new Error('execution reverted: ERC721NonexistentToken(42)'))
    const { ownerOf } = await import('../../utilities/contractUtils')
    await expect(ownerOf(42)).rejects.toThrow(/nonexistent|revert/i)
  })

  it('getEncryptionKey when caller is not owner surfaces the revert string', async () => {
    readContract.mockRejectedValue(new Error('execution reverted: Caller is not the owner'))
    const { getEncryptionKey } = await import('../../utilities/contractUtils')
    await expect(getEncryptionKey(0)).rejects.toThrow(/not the owner/i)
  })
})
