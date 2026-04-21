# Anatomy of the iQube Testing Suite

This document explains **what each layer of the testing suite does, why it
exists, and how to work with it**. It is written as a learning reference — the
skills here (requirements-based testing, V-model layering, structural coverage,
fault injection, performance envelopes) transfer directly to aerospace /
avionics software practice (DO-178C) and to any rigorous systems-engineering
role.

---

## 1. The V-Model at a Glance

Every layer on the left descends from a level of design. Every layer on the
right verifies that level of design. Tests on higher rungs cost more but
catch integration defects lower rungs cannot see.

```
                    REQUIREMENTS / SPEC
                         │
                         ▼
                    SYSTEM DESIGN  ←────────────  System / Load Tests
                         │                        (src/test/load)
                         ▼
                COMPONENT DESIGN  ←──────────  Integration Tests
                         │                      (src/test/integration)
                         ▼
                 DETAILED DESIGN  ←──────  Component Unit Tests
                         │                    (src/test/unit/contractUtils,
                         │                     src/test/unit/contractHooks,
                         │                     contract/test/IQubeNFT.t.sol)
                         ▼
                      CODE  ←───────  Pure-logic Unit Tests
                                        (src/test/unit/iqube.test.ts)
```

Fault-injection (`src/test/fault-injection`) cuts across levels — it simulates
off-nominal conditions (RPC timeouts, user rejection, reverts) that the happy
paths above don't exercise.

---

## 2. Each Test Level in Detail

### 2.1 Pure-logic unit tests — `src/test/unit/iqube.test.ts`
- **What:** functions with no I/O (`calculateRiskScore`, `getDefaultFields`, …).
- **Why:** cheapest, fastest feedback; catches algorithmic regressions.
- **Runner:** Vitest, `jsdom` environment (irrelevant here; see 2.2).
- **Oracle:** hand-computed expected values.
- **Aerospace parallel:** low-level requirements (LLR) verification per
  DO-178C §6.4.2; typically achieves MC/DC coverage.

### 2.2 Module unit tests with mocks — `contractUtils.test.ts`, `contractHooks.test.tsx`
- **What:** our code's behavior *at the seam* to viem, with viem mocked.
- **Why:** verifies we call the library correctly without network or wallet.
- **Oracle:** mock call shape (functionName, args, account).
- **Boundary cases:** tokenId = 0, 2^256-1; null wallet; stale-read cancellation.
- **Aerospace parallel:** interface control document (ICD) conformance testing.

### 2.3 Solidity contract tests — `contract/test/IQubeNFT.t.sol`
- **What:** the contract itself, tested in Solidity with Forge.
- **Why:** the ground-truth tests of on-chain behavior; run in the same VM.
- **Forms:** concrete tests + **fuzz tests** (256 randomized runs per fuzz)
  + invariant tests (properties that must hold across call sequences).
- **Oracle:** `assertEq`, `vm.expectRevert`, `vm.expectEmit`.
- **Aerospace parallel:** this is the closest analog to hardware/firmware
  unit testing on the *actual* target — no simulator between you and the
  component.

### 2.4 Integration tests — `src/test/integration/*.test.ts`
- **What:** full stack: TS client → viem → Anvil (local EVM) → contract.
- **Why:** catches mismatches between ABI, client code, and on-chain reality
  that pure unit tests cannot see.
- **Runner:** Vitest, Node environment, `beforeAll` spawns `anvil`.
- **Oracle:** transaction receipts, event logs, on-chain state reads.
- **Aerospace parallel:** SIL (software-in-the-loop) — real code, simulated
  world.

### 2.5 Fault-injection — `src/test/fault-injection/*.test.ts`
- **What:** make viem fail (timeout, 503, chain mismatch, reverts).
- **Why:** verify the system surfaces errors *loudly* (never silent).
- **Oracle:** the error message pattern the user sees.
- **Aerospace parallel:** off-nominal / failure-mode analysis (FMEA). In
  avionics, every sensor failure must annunciate — silence is a bug.

### 2.6 Load tests — `src/test/load/*.load.ts`
- **What:** N concurrent workers minting/burning for T seconds.
- **Measurements:** per-op latency, throughput, failure rate.
- **Reports:** `reports/<label>-<timestamp>.json` and `.csv`.
- **Acceptance envelope:** `minThroughputOpsSec`, `maxP95Ms`, `maxP99Ms`,
  `maxFailureRate`. The test **fails** if the envelope is violated.
- **Aerospace parallel:** performance qualification tests with documented
  acceptance criteria — evidence artifacts that, in a formal process, would
  be attached to a Test Procedure result.

---

## 3. How to Run

There are two equivalent ways to run tests: the **test CLI** (discoverable,
menu-driven) or **npm scripts** (direct, scriptable).

### 3.1 The test CLI (recommended for humans)

```bash
./scripts/test-cli.mjs           # interactive menu (pick a layer)
./scripts/test-cli.mjs unit      # run one layer directly
./scripts/test-cli.mjs list      # enumerate every test + REQ-ID
./scripts/test-cli.mjs show load # details for one layer (files, tests, REQs)
./scripts/test-cli.mjs help      # full reference

# Same via npm
npm run t                        # interactive menu
npm run tests                    # list every test
```

The menu shows each layer's test count and REQ-ID count so new contributors
can see at a glance what's covered:

```
  1) Unit                    (35 tests in 3 files, 17 REQs)
      Pure logic + mocked viem. Fastest. No network.
  2) Contract (Solidity)     (12 tests in 1 files, 8 REQs)
      Foundry tests: mint/burn/fuzz/invariants in Solidity.
  3) Integration             (6 tests in 2 files, 10 REQs)
      Real Anvil node, real transactions. Requires Foundry.
  ...
```

The `list` command prints every test file grouped by layer, with REQ-IDs
tagged in cyan — this is the runtime version of `docs/TRACEABILITY.md`, built
by parsing the test files themselves. If the list and the matrix disagree,
one of them is stale.

### 3.2 NPM scripts (recommended for CI / scripting)

```bash
# The pyramid, fast → slow
npm run test               # unit only (default; sub-second)
npm run test:unit          # same as above
npm run test:contract      # Solidity via forge test (no Anvil needed)
npm run test:fault         # fault-injection with mocked RPC
npm run test:integration   # spawns Anvil, runs real mint/burn
npm run test:load          # load harness; writes reports/
npm run test:coverage      # unit with V8 coverage + thresholds
npm run test:all           # unit + contract + integration + fault

# Tune load tests
LOAD_OPS=1000 LOAD_WORKERS=8 npm run test:load
# Or via the CLI:
LOAD_OPS=1000 LOAD_WORKERS=8 ./scripts/test-cli.mjs load
```

---

## 4. Requirements Traceability

Every test is labeled with a `REQ-XXX-NNN` identifier. See
[TRACEABILITY.md](./TRACEABILITY.md) for the matrix.

Rules of the road:
1. Write the requirement first (or at least simultaneously).
2. Every `it(...)` should reference its REQ-ID in the name or a comment.
3. Every REQ-ID should have ≥ 1 passing test.
4. Audit the matrix before each release.

---

## 5. Writing a New Test (Template)

```ts
// src/test/unit/newFeature.test.ts
import { describe, it, expect } from 'vitest'

// REQ-FEAT-001 Description of the requirement this test verifies
describe('REQ-FEAT-001 my new feature', () => {
  it('does X when Y', () => {
    // Arrange
    const input = buildInput()
    // Act
    const out = subjectUnderTest(input)
    // Assert (oracle)
    expect(out).toEqual(expected)
  })

  // Boundary case
  it('handles the zero case', () => { /* ... */ })

  // Negative case
  it('rejects invalid input with a legible error', () => {
    expect(() => subjectUnderTest(bad)).toThrow(/legible pattern/i)
  })
})
```

Then add the REQ-ID + file path to `TRACEABILITY.md`.

---

## 6. Reading a Coverage Report

`npm run test:coverage` produces:
- **Console table** — per-file %statements, %branches, %functions, %lines.
- **HTML report** at `coverage/index.html` — click a file to see green/red
  highlighted lines.
- **`json-summary`** — machine-readable, for CI dashboards.

Interpretation guide:
- **Lines / Statements ≈** "did this line run?"
- **Branches** = "did both sides of each if/else run?"  Branches are where
  bugs hide.
- **Functions** = "was this function ever called?"

Aerospace projects at DAL-A require **MC/DC** coverage (Modified Condition /
Decision Coverage) — every condition in a branch must independently affect
the outcome. V8 coverage gives you statement + branch, which is the working
approximation most teams start with.

**Coverage is a floor, not a target.** 100% coverage with bad assertions is
worthless. 70% coverage with sharp assertions is better than 100% with
`expect(x).toBeDefined()`.

---

## 7. Reading Load-Test Percentiles

A single p50 / p95 / p99 number tells you this:
- **p50 (median)** — half of operations finish faster than this. Tracks
  "typical" behavior.
- **p95** — 5% of operations are slower. Tracks "bad day" behavior.
- **p99** — the tail. Tracks "worst case that users will still see routinely
  at scale".

Aerospace framing: latency SLAs are always percentile-based, never mean-based.
A mean can hide a 2-second tail that crashes a control loop. Always gate on
tails (p95 / p99) plus throughput.

Our gates (in `mint.load.ts` / `burn.load.ts`):
```
minThroughputOpsSec: 20    // floor
maxP95Ms: 1500             // 95% of ops must be under 1.5s
maxP99Ms: 3000             // worst 1% must still be under 3s
maxFailureRate: 0.01       // no more than 1% tx failures
```

On a dev laptop against Anvil we routinely see **~300 ops/s, p95 ~80ms**,
but these gates set a defensible floor that would also pass on modest CI
hardware.

---

## 8. Aerospace Parallels Quick Reference

| This suite                  | DO-178C / avionics analog                      |
|-----------------------------|------------------------------------------------|
| REQ-IDs + traceability      | Requirements-based testing (§6.4.2)            |
| Pure-logic unit tests       | LLR verification                                |
| Solidity Foundry tests      | Target-code verification                        |
| Fuzz + invariant tests      | Boundary analysis + randomized robustness tests |
| Integration tests w/ Anvil  | SIL (software-in-the-loop)                      |
| Fault-injection             | FMEA / off-nominal testing                      |
| Load tests w/ gates         | Performance qualification with acceptance criteria |
| Coverage thresholds         | Structural coverage (statement / branch / MC/DC) |
| GitHub Actions CI           | Regression test suite per DO-178C §6.4.3        |

---

## 9. Common Gotchas

- **Anvil not on PATH** — `foundryup` installs to `~/.foundry/bin`. Integration/load
  fixtures extend PATH automatically, but if `anvil` fails to spawn, start a new
  shell or `export PATH="$HOME/.foundry/bin:$PATH"`.
- **Slow receipts** — viem defaults `pollingInterval` to 4000ms. The anvil fixture
  overrides this to 50ms, which is essential for load tests.
- **Coverage drops after refactor** — coverage is scoped to mint/burn critical
  path files only (see `vitest.config.ts` > `coverage.include`). Adding a new
  utility file won't lower coverage; removing tests will.
- **Integration tests appear to hang** — Anvil binds port 8546. If a previous
  test left it up, kill with `lsof -ti:8546 | xargs kill`.
