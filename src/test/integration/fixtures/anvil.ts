import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { createPublicClient, createWalletClient, http, type Address, type Hash } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { anvil as anvilChain } from 'viem/chains'

// ─────────────────────────────────────────────────────────────────────────────
// Anvil fixture — spawns a local EVM node for integration & load tests.
//
// Aerospace analog: "software-in-the-loop" (SIL). We substitute the real
// blockchain (plant) with a deterministic local simulator so we can exercise
// the system without cost or nondeterminism.
// ─────────────────────────────────────────────────────────────────────────────

// Anvil's default deterministic test accounts (mnemonic:
// "test test test test test test test test test test test junk").
// Ten pre-funded accounts, each with 10000 ETH.
const ANVIL_PRIVATE_KEYS: `0x${string}`[] = [
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
  '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
  '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
  '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba',
  '0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e',
  '0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356',
  '0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97',
  '0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6',
]

const ANVIL_PORT = 8546

export type AnvilFixture = {
  rpcUrl: string
  accounts: ReturnType<typeof privateKeyToAccount>[]
  publicClient: ReturnType<typeof createPublicClient>
  walletClients: ReturnType<typeof createWalletClient>[]
  stop: () => Promise<void>
  // Handy helpers for integration tests:
  waitForReceipt: (hash: Hash) => Promise<{ status: 'success' | 'reverted' }>
  getBalance: (addr: Address) => Promise<bigint>
}

function waitForHttp(url: string, timeoutMs = 10_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  return new Promise<void>((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', method: 'web3_clientVersion', params: [], id: 1 }),
        })
        if (res.ok) return resolve()
      } catch {
        /* not up yet */
      }
      if (Date.now() > deadline) return reject(new Error('anvil did not start in time'))
      setTimeout(tick, 100)
    }
    tick()
  })
}

export async function startAnvil(): Promise<AnvilFixture> {
  const rpcUrl = `http://127.0.0.1:${ANVIL_PORT}`
  // We pass PATH-extended env so `anvil` resolves even when Foundry lives in
  // ~/.foundry/bin rather than the default shell PATH (common on fresh installs).
  const env = {
    ...process.env,
    PATH: `${process.env.HOME}/.foundry/bin:${process.env.PATH ?? ''}`,
  }
  const proc: ChildProcessWithoutNullStreams = spawn(
    'anvil',
    ['--port', String(ANVIL_PORT), '--chain-id', '31337', '--accounts', '10', '--silent'],
    { env },
  )
  proc.on('error', (err) => {
    // If anvil binary is missing, fail loud early.
    throw err
  })

  await waitForHttp(rpcUrl)

  const accounts = ANVIL_PRIVATE_KEYS.map((k) => privateKeyToAccount(k))
  // Short pollingInterval → fast waitForTransactionReceipt on instamine.
  // Default is 4_000ms which crushes throughput tests.
  const publicClient = createPublicClient({
    chain: anvilChain,
    transport: http(rpcUrl),
    pollingInterval: 50,
  })
  const walletClients = accounts.map((account) =>
    createWalletClient({ account, chain: anvilChain, transport: http(rpcUrl), pollingInterval: 50 }),
  )

  return {
    rpcUrl,
    accounts,
    publicClient,
    walletClients,
    stop: async () => {
      proc.kill('SIGTERM')
      await new Promise<void>((r) => {
        if (proc.exitCode !== null) return r()
        proc.once('exit', () => r())
      })
    },
    waitForReceipt: async (hash: Hash) => {
      const r = await publicClient.waitForTransactionReceipt({ hash })
      return { status: r.status }
    },
    getBalance: (addr: Address) => publicClient.getBalance({ address: addr }),
  }
}
