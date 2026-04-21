import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { performance } from 'node:perf_hooks'
import { startAnvil, type AnvilFixture } from '../integration/fixtures/anvil'
import { deployContract } from '../integration/fixtures/deployContract'
import { summarize, writeReport, printSummary, type Sample } from './reporter'

// ─────────────────────────────────────────────────────────────────────────────
// Load test — concurrent minting on local Anvil.
//
// REQUIREMENTS covered (see docs/TRACEABILITY.md):
//   REQ-PERF-001  System shall sustain ≥ floor mints/sec on local Anvil
//   REQ-PERF-002  Mint p95 latency ≤ ceiling on local Anvil
//   REQ-PERF-003  Failure rate ≤ ceiling under burst
//
// Mechanics:
//   - 8 concurrent workers (one wallet each) mint sequentially for their share.
//   - Each wallet maintains its own nonce — no contention on a single sender.
//   - We measure per-op latency from writeContract-send through receipt-seen.
//
// Tune via env vars:
//   LOAD_OPS=1000   total mints (default 200 — keep CI reasonable)
//   LOAD_WORKERS=8  concurrent wallets
// ─────────────────────────────────────────────────────────────────────────────

const TOTAL_OPS = Number(process.env.LOAD_OPS ?? 200)
const CONCURRENCY = Math.min(Number(process.env.LOAD_WORKERS ?? 8), 10) // Anvil fixture exposes 10 wallets

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

describe('REQ-PERF-001/002/003 mint load test', () => {
  it(`sustains load: ${TOTAL_OPS} mints across ${CONCURRENCY} workers`, async () => {
    const opsPerWorker = Math.ceil(TOTAL_OPS / CONCURRENCY)
    const samples: Sample[] = []

    const t0 = performance.now()

    await Promise.all(
      Array.from({ length: CONCURRENCY }, (_, w) => worker(w, opsPerWorker, samples)),
    )

    const durationSec = (performance.now() - t0) / 1000

    // Trim to exactly TOTAL_OPS in case workers over-shot the ceiling-div
    const trimmed = samples.slice(0, TOTAL_OPS)

    const summary = summarize('mint', trimmed, CONCURRENCY, durationSec, {
      // Acceptance envelope — generous defaults for dev laptops; tune for CI hardware.
      minThroughputOpsSec: 20,
      maxP95Ms: 1500,
      maxP99Ms: 3000,
      maxFailureRate: 0.01,
    })

    const paths = writeReport(summary, trimmed)
    printSummary(summary)

    console.log(`  artifacts: ${paths.jsonPath}\n             ${paths.csvPath}`)

    // Aerospace-style assertion: fail if acceptance gate violated.
    expect(summary.acceptance.pass, summary.acceptance.violations.join('; ')).toBe(true)
  })
})

async function worker(idx: number, ops: number, samples: Sample[]) {
  const wallet = fx.walletClients[idx]
  const from = wallet.account!.address
  for (let i = 0; i < ops; i++) {
    const t0 = performance.now()
    try {
      const hash = await wallet.writeContract({
        address: contractAddress,
        abi,
        functionName: 'mintQube',
        args: [from, `ipfs://load-${idx}-${i}`, `key-${idx}-${i}`],
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
