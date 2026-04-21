import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// ─────────────────────────────────────────────────────────────────────────────
// Vitest configuration
//
// Four "projects" (test levels), mirroring the aerospace V-model:
//
//   unit             — hermetic, no I/O, ms-per-test     (always runs)
//   integration      — real Anvil node, real transactions  (CI + local)
//   fault-injection  — simulated RPC failures (timeouts, reverts, reorgs)
//   load             — throughput/latency envelope    (nightly / manual)
//
// Each project fully defines its own include + environment so nothing
// leaks across layers.
// ─────────────────────────────────────────────────────────────────────────────

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      // Scope coverage to the mint/burn critical path + risk logic.
      // Other utility files (Avalabs, MetaContract, encryption helpers)
      // are legacy/unexercised and out of scope for this suite.
      include: [
        'src/utilities/contractUtils.ts',
        'src/hooks/contractHooks.ts',
        'src/types/iqube.ts',
      ],
      exclude: [
        'src/test/**',
        'src/**/*.d.ts',
      ],
      // Coverage thresholds are *floors* (not targets). Current baseline is
      // ~50% across the mint/burn critical path — a reasonable ratchet point
      // given three of the five hooks are covered and ~90% of contractUtils.
      // Raise these as tests for transfer / metaQube / encryptionKey hooks
      // and the full risk-scoring surface are added.
      thresholds: {
        lines: 50,
        branches: 50,
        functions: 50,
        statements: 50,
      },
    },
    projects: [
      {
        plugins: [react()],
        test: {
          globals: true,
          name: 'unit',
          include: ['src/test/unit/**/*.{test,spec}.{ts,tsx}'],
          setupFiles: ['./src/test/setup.ts'],
          environment: 'jsdom',
        },
      },
      {
        test: {
          globals: true,
          name: 'integration',
          include: ['src/test/integration/**/*.{test,spec}.ts'],
          environment: 'node',
          testTimeout: 60_000,
          hookTimeout: 60_000,
          fileParallelism: false, // each file spawns its own Anvil on same port
        },
      },
      {
        plugins: [react()],
        test: {
          globals: true,
          name: 'fault-injection',
          include: ['src/test/fault-injection/**/*.{test,spec}.ts'],
          setupFiles: ['./src/test/setup.ts'],
          environment: 'jsdom',
        },
      },
      {
        test: {
          globals: true,
          name: 'load',
          include: ['src/test/load/**/*.load.ts'],
          environment: 'node',
          testTimeout: 600_000,
          hookTimeout: 600_000,
          fileParallelism: false,
        },
      },
    ],
  },
})
