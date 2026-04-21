import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Address, Hex } from 'viem'
import type { AnvilFixture } from './anvil'

// Loads the compiled artifact produced by `forge build` for iQubeNFTExtended.
// Path is relative to the project root (where vitest is invoked).
const ARTIFACT_PATH = resolve(
  process.cwd(),
  'contract/out/iqubeExtended.sol/iQubeNFTExtended.json',
)

type Artifact = {
  abi: unknown[]
  bytecode: { object: Hex } | Hex
}

export function loadArtifact(): { abi: readonly unknown[]; bytecode: Hex } {
  const raw = readFileSync(ARTIFACT_PATH, 'utf8')
  const parsed: Artifact = JSON.parse(raw)
  const bytecode =
    typeof parsed.bytecode === 'string' ? parsed.bytecode : parsed.bytecode.object
  return { abi: parsed.abi as readonly unknown[], bytecode }
}

export async function deployContract(
  fx: AnvilFixture,
  deployerIndex = 0,
): Promise<{ address: Address; abi: readonly unknown[] }> {
  const { abi, bytecode } = loadArtifact()
  const deployer = fx.walletClients[deployerIndex]
  const owner = fx.accounts[deployerIndex].address
  // viem's deployContract returns the tx hash; we resolve the deployed address
  // from the receipt.
  const hash = await deployer.deployContract({
    abi,
    bytecode,
    args: [owner],
  })
  const receipt = await fx.publicClient.waitForTransactionReceipt({ hash })
  if (!receipt.contractAddress) {
    throw new Error('deployment receipt missing contractAddress')
  }
  return { address: receipt.contractAddress, abi }
}
