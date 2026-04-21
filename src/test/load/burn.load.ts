import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { performance } from 'node:perf_hooks'
import { startAnvil, type AnvilFixture } from '../integration/fixtures/anvil'
import { deployContract } from '../integration/fixtures/deployContract'
import { summarize, writeReport, printSummary, type Sample } from './reporter'

// ─────────────────────────────────────────────────────────────────────────────
// Load test — concurrent burning on local Anvil.
//
// REQUIREMENTS covered (see docs/TRACEABILITY.md):
//   REQ-PERF-004  System shall sustain ≥ floor burns/sec on local Anvil
//   REQ-PERF-005  Burn p95 latency ≤ ceiling on local Anvil
//
// Two-phase:
//   1) Pre-mint — each worker mints its share of tokens (not timed).
//   2) Burn phase — each worker burns its tokens; only this is measured.
// ─────────────────────────────────────────────────────────────────────────────

const TOTAL_OPS = Number(process.env.LOAD_OPS ?? 200)
const CONCURRENCY = Math.min(Number(process.env.LOAD_WORKERS ?? 8), 10)

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

describe('REQ-PERF-004/005 burn load test', () => {
  it(`sustains burn load: ${TOTAL_OPS} burns across ${CONCURRENCY} workers`, async () => {
    const opsPerWorker = Math.ceil(TOTAL_OPS / CONCURRENCY)
    // Phase 1 — pre-mint. Track each worker's minted tokenIds.
    const workerTokens: bigint[][] = []
    let nextTokenId = 0n
    for (let w = 0; w < CONCURRENCY; w++) {
      const wallet = fx.walletClients[w]
      const from = wallet.account!.address
      const ids: bigint[] = []
      for (let i = 0; i < opsPerWorker; i++) {
        const hash = await wallet.writeContract({
          address: contractAddress,
          abi,
          functionName: 'mintQube',
          args: [from, `ipfs://load-mint-${w}-${i}`, `key-${w}-${i}`],
        })
        await fx.publicClient.waitForTransactionReceipt({ hash })
        ids.push(nextTokenId++)
      }
      workerTokens.push(ids)
    }

    // Phase 2 — burn, timed.
    const samples: Sample[] = []
    const t0 = performance.now()

    await Promise.all(
      workerTokens.map((ids, w) => burnWorker(w, ids, samples)),
    )

    const durationSec = (performance.now() - t0) / 1000
    const trimmed = samples.slice(0, TOTAL_OPS)

    const summary = summarize('burn', trimmed, CONCURRENCY, durationSec, {
      minThroughputOpsSec: 20,
      maxP95Ms: 1500,
      maxP99Ms: 3000,
      maxFailureRate: 0.01,
    })

    const paths = writeReport(summary, trimmed)
    printSummary(summary)

    console.log(`  artifacts: ${paths.jsonPath}\n             ${paths.csvPath}`)

    expect(summary.acceptance.pass, summary.acceptance.violations.join('; ')).toBe(true)
  })
})

async function burnWorker(idx: number, tokenIds: bigint[], samples: Sample[]) {
  const wallet = fx.walletClients[idx]
  for (const id of tokenIds) {
    const t0 = performance.now()
    try {
      const hash = await wallet.writeContract({
        address: contractAddress,
        abi,
        functionName: 'burnQube',
        args: [id],
      })
      await fx.publicClient.waitForTransactionReceipt({ hash })
      samples.push({ latencyMs: performance.now() - t0, ok: true })
    } catch (err) {
      samples.push({
        latencyMs: performance.now() - t0,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }
}
