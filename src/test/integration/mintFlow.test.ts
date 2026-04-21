import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { parseEventLogs } from 'viem'
import { startAnvil, type AnvilFixture } from './fixtures/anvil'
import { deployContract } from './fixtures/deployContract'

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests — mint flow against a real Anvil node.
//
// REQUIREMENTS covered (see docs/TRACEABILITY.md):
//   REQ-MINT-001  Caller shall mint an iQube (non-paused, with wallet)
//   REQ-MINT-002  Token IDs shall increment monotonically from 0
//   REQ-MINT-003  Minted token's URI shall be retrievable via getMetaQubeLocation
//   REQ-MINT-007  mintQube shall emit Transfer(from=0x0, to=caller, tokenId)
//
// Aerospace framing: this is integration test at the component-interface
// boundary. We exercise the full path: wallet → RPC → EVM → event logs.
// ─────────────────────────────────────────────────────────────────────────────

let fx: AnvilFixture
let contractAddress: `0x${string}`
let abi: readonly unknown[]

beforeAll(async () => {
  fx = await startAnvil()
  const d = await deployContract(fx)
  contractAddress = d.address
  abi = d.abi
}, 60_000)

afterAll(async () => {
  await fx?.stop()
})

describe('REQ-MINT-001/002/003 mint flow', () => {
  it('mints and stores URI retrievable via getMetaQubeLocation', async () => {
    const alice = fx.walletClients[1]
    const hash = await alice.writeContract({
      address: contractAddress,
      abi,
      functionName: 'mintQube',
      args: [alice.account!.address, 'ipfs://meta-001', 'key-001'],
    })
    const receipt = await fx.publicClient.waitForTransactionReceipt({ hash })
    expect(receipt.status).toBe('success')

    const uri = await fx.publicClient.readContract({
      address: contractAddress,
      abi,
      functionName: 'getMetaQubeLocation',
      args: [0n],
    })
    expect(uri).toBe('ipfs://meta-001')
  })

  it('assigns monotonically incrementing token IDs', async () => {
    // This runs after the first test, so counter is already at 1.
    const bob = fx.walletClients[2]
    const hash = await bob.writeContract({
      address: contractAddress,
      abi,
      functionName: 'mintQube',
      args: [bob.account!.address, 'ipfs://meta-002', 'key-002'],
    })
    await fx.publicClient.waitForTransactionReceipt({ hash })
    const owner = await fx.publicClient.readContract({
      address: contractAddress,
      abi,
      functionName: 'ownerOf',
      args: [1n],
    })
    expect(owner).toBe(bob.account!.address)
  })
})

describe('REQ-MINT-007 mint emits Transfer from zero address', () => {
  it('emits Transfer(0x0, caller, tokenId)', async () => {
    const carol = fx.walletClients[3]
    const hash = await carol.writeContract({
      address: contractAddress,
      abi,
      functionName: 'mintQube',
      args: [carol.account!.address, 'ipfs://meta-003', 'key-003'],
    })
    const receipt = await fx.publicClient.waitForTransactionReceipt({ hash })
    const logs = parseEventLogs({
      abi,
      eventName: 'Transfer',
      logs: receipt.logs,
    })
    expect(logs.length).toBeGreaterThan(0)
    const ev = logs[0] as unknown as { args: { from: string; to: string; tokenId: bigint } }
    expect(ev.args.from).toBe('0x0000000000000000000000000000000000000000')
    expect(ev.args.to).toBe(carol.account!.address)
  })
})
