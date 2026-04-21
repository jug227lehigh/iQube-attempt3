import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// ─────────────────────────────────────────────────────────────────────────────
// Load-test reporter
//
// Records per-op samples (latency_ms, ok) and produces a summary with p50/p95/p99,
// throughput, and failure rate. Writes JSON + CSV artifacts to `reports/`.
//
// Aerospace framing: a load test's acceptance criteria are its performance
// envelope. This reporter emits the evidence artifact that, in a formal
// process, would be attached to a test procedure result.
// ─────────────────────────────────────────────────────────────────────────────

export type Sample = { latencyMs: number; ok: boolean; error?: string }

export type LoadSummary = {
  label: string
  totalOps: number
  concurrency: number
  durationSec: number
  throughputOpsSec: number
  failures: number
  failureRate: number
  latency: {
    min: number
    p50: number
    p95: number
    p99: number
    max: number
    mean: number
  }
  acceptance: {
    gate: Record<string, number | undefined>
    pass: boolean
    violations: string[]
  }
}

export type AcceptanceGate = {
  minThroughputOpsSec?: number
  maxP95Ms?: number
  maxP99Ms?: number
  maxFailureRate?: number
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
  return sorted[idx]
}

export function summarize(
  label: string,
  samples: Sample[],
  concurrency: number,
  durationSec: number,
  gate: AcceptanceGate = {},
): LoadSummary {
  const okLatencies = samples
    .filter((s) => s.ok)
    .map((s) => s.latencyMs)
    .sort((a, b) => a - b)
  const failures = samples.filter((s) => !s.ok).length
  const mean = okLatencies.length
    ? okLatencies.reduce((a, b) => a + b, 0) / okLatencies.length
    : NaN
  const throughput = durationSec > 0 ? samples.length / durationSec : NaN
  const failureRate = samples.length > 0 ? failures / samples.length : 0

  const violations: string[] = []
  if (gate.minThroughputOpsSec != null && throughput < gate.minThroughputOpsSec) {
    violations.push(
      `throughput ${throughput.toFixed(2)} ops/s < min ${gate.minThroughputOpsSec}`,
    )
  }
  const p95 = percentile(okLatencies, 95)
  const p99 = percentile(okLatencies, 99)
  if (gate.maxP95Ms != null && p95 > gate.maxP95Ms) {
    violations.push(`p95 ${p95.toFixed(1)}ms > max ${gate.maxP95Ms}ms`)
  }
  if (gate.maxP99Ms != null && p99 > gate.maxP99Ms) {
    violations.push(`p99 ${p99.toFixed(1)}ms > max ${gate.maxP99Ms}ms`)
  }
  if (gate.maxFailureRate != null && failureRate > gate.maxFailureRate) {
    violations.push(
      `failureRate ${(failureRate * 100).toFixed(2)}% > max ${(gate.maxFailureRate * 100).toFixed(2)}%`,
    )
  }

  return {
    label,
    totalOps: samples.length,
    concurrency,
    durationSec,
    throughputOpsSec: throughput,
    failures,
    failureRate,
    latency: {
      min: okLatencies[0] ?? NaN,
      p50: percentile(okLatencies, 50),
      p95,
      p99,
      max: okLatencies.at(-1) ?? NaN,
      mean,
    },
    acceptance: {
      gate: {
        minThroughputOpsSec: gate.minThroughputOpsSec,
        maxP95Ms: gate.maxP95Ms,
        maxP99Ms: gate.maxP99Ms,
        maxFailureRate: gate.maxFailureRate,
      },
      pass: violations.length === 0,
      violations,
    },
  }
}

export function writeReport(summary: LoadSummary, samples: Sample[]): { jsonPath: string; csvPath: string } {
  const dir = resolve(process.cwd(), 'reports')
  mkdirSync(dir, { recursive: true })
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const jsonPath = resolve(dir, `${summary.label}-${ts}.json`)
  const csvPath = resolve(dir, `${summary.label}-${ts}.csv`)
  writeFileSync(jsonPath, JSON.stringify({ summary, samples }, null, 2))
  const csv = [
    'op_index,latency_ms,ok,error',
    ...samples.map((s, i) => `${i},${s.latencyMs.toFixed(3)},${s.ok ? 1 : 0},${JSON.stringify(s.error ?? '')}`),
  ].join('\n')
  writeFileSync(csvPath, csv)
  return { jsonPath, csvPath }
}

export function printSummary(summary: LoadSummary): void {
  const fmt = (n: number) => (Number.isFinite(n) ? n.toFixed(2) : 'n/a')

  console.log(`\n── Load summary: ${summary.label} ──`)

  console.log(`  ops=${summary.totalOps} concurrency=${summary.concurrency} duration=${fmt(summary.durationSec)}s`)

  console.log(`  throughput=${fmt(summary.throughputOpsSec)} ops/s failures=${summary.failures} (${fmt(summary.failureRate * 100)}%)`)

  console.log(`  latency ms: p50=${fmt(summary.latency.p50)} p95=${fmt(summary.latency.p95)} p99=${fmt(summary.latency.p99)} max=${fmt(summary.latency.max)}`)

  console.log(`  acceptance: ${summary.acceptance.pass ? 'PASS' : 'FAIL — ' + summary.acceptance.violations.join('; ')}`)
}
