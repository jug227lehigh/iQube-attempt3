import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ─────────────────────────────────────────────────────────────────────────────
// REQUIREMENTS covered by this file (see docs/TRACEABILITY.md):
//   REQ-MINT-001  Caller with a connected wallet shall mint an iQube
//   REQ-MINT-006  mintQube shall forward URI + encryption key to writeContract
//   REQ-READ-001  getMetaQubeLocation shall call readContract with correct args
//   REQ-READ-002  ownerOf shall call readContract with correct args
//   REQ-ROBUST-002 Missing wallet provider shall surface an explicit error
//
// Strategy: mock viem so we never touch a real RPC. We verify that our
// wrappers build the correct call shape (address, ABI, functionName, args)
// and surface errors faithfully. This is boundary testing of the seam between
// our code and the viem client — the aerospace analog is testing a driver's
// conformance to an ICD (Interface Control Document) without exercising the
// device under it.
// ─────────────────────────────────────────────────────────────────────────────

// viem is a large module; we only stub the pieces we use.
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

// Helper: set or unset window.ethereum between tests
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
})

afterEach(() => {
  // Reset window between tests so cases are independent
  setEthereum({})
})

// ─── mintQube — happy path + boundary ───────────────────────────────────────

describe('REQ-MINT-006 mintQube → writeContract shape', () => {
  it('builds writeContract args with URI, encryption key, and connected account', async () => {
    setEthereum({ isMetaMask: true })
    getAddresses.mockResolvedValue(['0x0000000000000000000000000000000000000001'])
    writeContract.mockResolvedValue('0xabc' as const)

    const { mintQube } = await import('../../utilities/contractUtils')
    const hash = await mintQube('ipfs://meta', 'key-xyz')

    expect(hash).toBe('0xabc')
    expect(writeContract).toHaveBeenCalledOnce()
    const args = writeContract.mock.calls[0][0]
    expect(args.functionName).toBe('mintQube')
    expect(args.args).toEqual(['ipfs://meta', 'key-xyz'])
    expect(args.account).toBe('0x0000000000000000000000000000000000000001')
    expect(args.address).toMatch(/^0x[0-9a-fA-F]{40}$/) // contract address from constants
  })

  it('REQ-ROBUST-002 throws explicit error when wallet provider is absent', async () => {
    setEthereum(undefined)
    const { mintQube } = await import('../../utilities/contractUtils')
    await expect(mintQube('ipfs://x', 'k')).rejects.toThrow(/wallet not available/i)
  })

  it('throws when no account is connected', async () => {
    setEthereum({ isMetaMask: true })
    getAddresses.mockResolvedValue([])
    const { mintQube } = await import('../../utilities/contractUtils')
    await expect(mintQube('ipfs://x', 'k')).rejects.toThrow(/no account connected/i)
  })

  it('propagates writeContract failure (e.g. user rejected tx)', async () => {
    setEthereum({ isMetaMask: true })
    getAddresses.mockResolvedValue(['0x0000000000000000000000000000000000000001'])
    writeContract.mockRejectedValue(new Error('User rejected the request.'))
    const { mintQube } = await import('../../utilities/contractUtils')
    await expect(mintQube('ipfs://x', 'k')).rejects.toThrow(/user rejected/i)
  })
})

// ─── transferQube — shape + boundary values ─────────────────────────────────

describe('transferQube → writeContract shape', () => {
  it('passes tokenId as bigint and recipient address', async () => {
    setEthereum({ isMetaMask: true })
    getAddresses.mockResolvedValue(['0x0000000000000000000000000000000000000001'])
    writeContract.mockResolvedValue('0xdef' as const)

    const { transferQube } = await import('../../utilities/contractUtils')
    await transferQube('0x00000000000000000000000000000000000000bB', 7)

    const args = writeContract.mock.calls[0][0]
    expect(args.functionName).toBe('transferQube')
    expect(args.args[0]).toBe('0x00000000000000000000000000000000000000bB')
    expect(args.args[1]).toBe(7n)
  })

  it('accepts boundary tokenId = 0', async () => {
    setEthereum({ isMetaMask: true })
    getAddresses.mockResolvedValue(['0x0000000000000000000000000000000000000001'])
    writeContract.mockResolvedValue('0x01' as const)
    const { transferQube } = await import('../../utilities/contractUtils')
    await transferQube('0x00000000000000000000000000000000000000bB', 0)
    expect(writeContract.mock.calls[0][0].args[1]).toBe(0n)
  })

  it('accepts boundary tokenId = 2^256 - 1', async () => {
    setEthereum({ isMetaMask: true })
    getAddresses.mockResolvedValue(['0x0000000000000000000000000000000000000001'])
    writeContract.mockResolvedValue('0x01' as const)
    const { transferQube } = await import('../../utilities/contractUtils')
    const maxU256 = 2n ** 256n - 1n
    // Function signature takes number | bigint; pass bigint for max range.
    await transferQube('0x00000000000000000000000000000000000000bB', maxU256)
    expect(writeContract.mock.calls[0][0].args[1]).toBe(maxU256)
  })
})

// ─── Read helpers — shape ───────────────────────────────────────────────────

describe('REQ-READ-001/002 read helpers', () => {
  it('getMetaQubeLocation calls readContract with correct args', async () => {
    readContract.mockResolvedValue('ipfs://abc')
    const { getMetaQubeLocation } = await import('../../utilities/contractUtils')
    const uri = await getMetaQubeLocation(42)
    expect(uri).toBe('ipfs://abc')
    const args = readContract.mock.calls.at(-1)![0]
    expect(args.functionName).toBe('getMetaQubeLocation')
    expect(args.args).toEqual([42n])
  })

  it('ownerOf calls readContract with correct args', async () => {
    readContract.mockResolvedValue('0x0000000000000000000000000000000000000001')
    const { ownerOf } = await import('../../utilities/contractUtils')
    const owner = await ownerOf(0)
    expect(owner).toMatch(/^0x[0-9a-fA-F]{40}$/)
    const args = readContract.mock.calls.at(-1)![0]
    expect(args.functionName).toBe('ownerOf')
    expect(args.args).toEqual([0n])
  })
})
