import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { parseEventLogs } from 'viem'
import { startAnvil, type AnvilFixture } from './fixtures/anvil'
import { deployContract } from './fixtures/deployContract'

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests — burn flow against a real Anvil node.
//
// REQUIREMENTS covered (see docs/TRACEABILITY.md):
//   REQ-BURN-001  Token owner shall burn their iQube
//   REQ-BURN-002  Non-owner shall be rejected with explicit revert
//   REQ-BURN-003  Burned token's ownerOf shall revert
//   REQ-BURN-004  Burn shall emit Transfer(owner, 0x0, tokenId)
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

async function mintAs(walletIdx: number, tokenIdExpected: bigint) {
  const w = fx.walletClients[walletIdx]
  const hash = await w.writeContract({
    address: contractAddress,
    abi,
    functionName: 'mintQube',
    args: [w.account!.address, `ipfs://meta-${tokenIdExpected}`, `key-${tokenIdExpected}`],
  })
  await fx.publicClient.waitForTransactionReceipt({ hash })
}

describe('REQ-BURN-001/003 owner can burn and token becomes unreadable', () => {
  it('burns and ownerOf reverts afterwards', async () => {
    await mintAs(1, 0n)  // alice mints tokenId 0
    const alice = fx.walletClients[1]

    const hash = await alice.writeContract({
      address: contractAddress,
      abi,
      functionName: 'burnQube',
      args: [0n],
    })
    const receipt = await fx.publicClient.waitForTransactionReceipt({ hash })
    expect(receipt.status).toBe('success')

    await expect(
      fx.publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'ownerOf',
        args: [0n],
      }),
    ).rejects.toThrow()
  })
})

describe('REQ-BURN-002 non-owner cannot burn', () => {
  it('rejects burn from a non-owner wallet', async () => {
    await mintAs(2, 1n)  // bob mints tokenId 1
    const mallory = fx.walletClients[4]

    await expect(
      mallory.writeContract({
        address: contractAddress,
        abi,
        functionName: 'burnQube',
        args: [1n],
      }),
    ).rejects.toThrow()
  })
})

describe('REQ-BURN-004 burn emits Transfer(owner, 0x0, tokenId)', () => {
  it('emits the zero-address Transfer event', async () => {
    await mintAs(3, 2n)  // carol mints tokenId 2
    const carol = fx.walletClients[3]

    const hash = await carol.writeContract({
      address: contractAddress,
      abi,
      functionName: 'burnQube',
      args: [2n],
    })
    const receipt = await fx.publicClient.waitForTransactionReceipt({ hash })
    const logs = parseEventLogs({ abi, eventName: 'Transfer', logs: receipt.logs })
    expect(logs.length).toBeGreaterThan(0)
    const ev = logs[0] as unknown as { args: { from: string; to: string; tokenId: bigint } }
    expect(ev.args.from).toBe(carol.account!.address)
    expect(ev.args.to).toBe('0x0000000000000000000000000000000000000000')
    expect(ev.args.tokenId).toBe(2n)
  })
})
