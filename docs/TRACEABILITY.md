# Requirements Traceability Matrix

Every testable requirement for the iQube mint/burn critical path maps to at
least one test. This matrix is the evidence artifact a reviewer uses to
answer: "does every requirement have a test, and does every test trace to a
requirement?"

Update this file whenever you add a requirement or a test.

---

## Minting

| REQ-ID | Requirement | Level | Test file · test name |
|---|---|---|---|
| REQ-MINT-001 | Any non-paused caller shall mint an iQube given a URI and encryption key | contract-unit, integration | `contract/test/IQubeNFT.t.sol::test_REQ_MINT_001_mintStoresURIAndKey`; `src/test/integration/mintFlow.test.ts::mints and stores URI…` |
| REQ-MINT-002 | Token IDs shall increment monotonically from 0 | contract-unit, integration | `contract/test/IQubeNFT.t.sol::test_REQ_MINT_002_tokenIdsIncrement`; `src/test/integration/mintFlow.test.ts::assigns monotonically…` |
| REQ-MINT-003 | Minted token's URI shall be retrievable via `getMetaQubeLocation` | integration | `src/test/integration/mintFlow.test.ts::mints and stores URI retrievable…` |
| REQ-MINT-004 | Minting shall fail when contract is paused | contract-unit | `contract/test/IQubeNFT.t.sol::test_REQ_MINT_004_revertsWhenPaused` |
| REQ-MINT-005 | Mint shall be robust to randomized input (no unintended reverts) | contract-fuzz | `contract/test/IQubeNFT.t.sol::testFuzz_mintNeverRevertsForValidInputs` |
| REQ-MINT-006 | `mintQube()` wrapper shall forward URI + encryption key to `writeContract` | unit | `src/test/unit/contractUtils.test.ts::builds writeContract args…` |
| REQ-MINT-007 | `mintQube` shall emit `Transfer(from=0x0, to=caller, tokenId)` | integration | `src/test/integration/mintFlow.test.ts::emits Transfer from zero…` |

## Burning

| REQ-ID | Requirement | Level | Test file · test name |
|---|---|---|---|
| REQ-BURN-001 | Token owner shall burn their iQube | contract-unit, integration | `contract/test/IQubeNFT.t.sol::test_REQ_BURN_001_ownerCanBurn`; `src/test/integration/burnFlow.test.ts::owner can burn and token becomes unreadable` |
| REQ-BURN-002 | Non-owner shall be rejected with an explicit revert | contract-unit, integration | `contract/test/IQubeNFT.t.sol::test_REQ_BURN_002_nonOwnerCannotBurn`; `src/test/integration/burnFlow.test.ts::rejects burn from a non-owner wallet` |
| REQ-BURN-003 | After burn, `ownerOf(tokenId)` shall revert | integration | `src/test/integration/burnFlow.test.ts::burns and ownerOf reverts afterwards` |
| REQ-BURN-004 | Burn shall emit `Transfer(owner, 0x0, tokenId)` | contract-unit, integration | `contract/test/IQubeNFT.t.sol::test_REQ_BURN_004_burnEmitsTransferToZero`; `src/test/integration/burnFlow.test.ts::emits the zero-address Transfer event` |

## Read operations

| REQ-ID | Requirement | Level | Test file · test name |
|---|---|---|---|
| REQ-READ-001 | `getMetaQubeLocation(tokenId)` shall return the stored URI | unit, integration | `src/test/unit/contractUtils.test.ts::getMetaQubeLocation calls readContract…` |
| REQ-READ-002 | `ownerOf(tokenId)` shall return the current owner | unit | `src/test/unit/contractUtils.test.ts::ownerOf calls readContract…` |
| REQ-READ-003 | `getEncryptionKey(tokenId)` shall be callable only by the token owner | contract-unit | `contract/test/IQubeNFT.t.sol::test_getEncryptionKey_onlyOwner` |

## Hook-layer (React)

| REQ-ID | Requirement | Level | Test file · test name |
|---|---|---|---|
| REQ-HOOK-MINT-001 | `useMintQube.mintQube()` shall set `transactionResult` on success | unit | `src/test/unit/contractHooks.test.tsx::sets transactionResult on successful mint` |
| REQ-HOOK-MINT-002 | `useMintQube.mintQube()` shall set `transactionError` on failure | unit | `src/test/unit/contractHooks.test.tsx::sets transactionError when mint rejects` |
| REQ-HOOK-READ-001 | `useOwnerOf` shall expose loading → data lifecycle | unit | `src/test/unit/contractHooks.test.tsx::starts in loading, resolves to data` |
| REQ-HOOK-READ-002 | `useOwnerOf` shall cancel stale reads on tokenId change | unit | `src/test/unit/contractHooks.test.tsx::does not overwrite newer result…` |

## Robustness / fault-injection

| REQ-ID | Requirement | Level | Test file · test name |
|---|---|---|---|
| REQ-ROBUST-001 | UI layer shall surface a user-readable error on RPC timeout | fault | `src/test/fault-injection/rpc-failures.test.ts::propagates timeout error` |
| REQ-ROBUST-002 | UI layer shall surface a user-readable error on user rejection | unit, fault | `src/test/unit/contractUtils.test.ts::throws explicit error when wallet provider is absent`; `src/test/fault-injection/rpc-failures.test.ts::propagates MetaMask user-rejection error` |
| REQ-ROBUST-003 | Read hooks shall propagate revert errors without crashing | fault | `src/test/fault-injection/rpc-failures.test.ts::ownerOf on nonexistent token surfaces revert` |
| REQ-ROBUST-004 | Missing wallet provider shall not cause silent failure | fault | `src/test/fault-injection/rpc-failures.test.ts::explicit error message when window.ethereum is undefined` |

## Performance

| REQ-ID | Requirement | Level | Test file · test name |
|---|---|---|---|
| REQ-PERF-001 | System shall sustain ≥ 20 mints/sec on local Anvil (8 workers) | load | `src/test/load/mint.load.ts::sustains load` |
| REQ-PERF-002 | Mint p95 latency shall be ≤ 1500 ms on local Anvil | load | `src/test/load/mint.load.ts::sustains load` |
| REQ-PERF-003 | Mint failure rate shall be ≤ 1% under burst | load | `src/test/load/mint.load.ts::sustains load` |
| REQ-PERF-004 | System shall sustain ≥ 20 burns/sec on local Anvil (8 workers) | load | `src/test/load/burn.load.ts::sustains burn load` |
| REQ-PERF-005 | Burn p95 latency shall be ≤ 1500 ms on local Anvil | load | `src/test/load/burn.load.ts::sustains burn load` |

## Logic (pure business rules)

| REQ-ID | Requirement | Level | Test file · test name |
|---|---|---|---|
| REQ-LOGIC-RISK-001 | Risk score shall be deterministic for fixed inputs | unit | `src/test/unit/iqube.test.ts::calculateRiskScore` block |
| REQ-LOGIC-RISK-002 | Risk score shall clamp to [0, 10] | unit | `src/test/unit/iqube.test.ts::clamps to 0 minimum`, `clamps to 10 maximum` |
| REQ-LOGIC-RISK-003 | Risk level buckets shall map score → {low, medium, high, critical} | unit | `src/test/unit/iqube.test.ts::getRiskLevel` block |
| REQ-LOGIC-DEFAULT-001 | Defaults shall be defined for every iQube type/category | unit | `src/test/unit/iqube.test.ts::getDefaultSensitivity` block |
| REQ-LOGIC-DEFAULT-002 | Fields marked `isSecret: true` shall be distinguishable from non-secret fields | unit | `src/test/unit/iqube.test.ts::password field is marked as secret` |
