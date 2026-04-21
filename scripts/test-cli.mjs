#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// iQube test CLI
//
// Usage:
//   ./scripts/test-cli.mjs                 # interactive menu
//   ./scripts/test-cli.mjs <layer>         # run a layer directly
//   ./scripts/test-cli.mjs list            # list every test + REQ-ID
//   ./scripts/test-cli.mjs show <layer>    # show details for one layer
//   ./scripts/test-cli.mjs help            # this message
//
// Layers: unit, contract, integration, fault, load, coverage, all
//
// Zero dependencies — pure Node ESM.
// ─────────────────────────────────────────────────────────────────────────────

import { spawn } from 'node:child_process'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { resolve, join, relative } from 'node:path'
import readline from 'node:readline'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = resolve(__dirname, '..')

// ── ANSI helpers ─────────────────────────────────────────────────────────────
const isTTY = process.stdout.isTTY
const ansi = (code) => (s) => isTTY ? `\x1b[${code}m${s}\x1b[0m` : String(s)
const bold = ansi('1')
const dim = ansi('2')
const red = ansi('31')
const green = ansi('32')
const yellow = ansi('33')
const blue = ansi('34')
const magenta = ansi('35')
const cyan = ansi('36')
const gray = ansi('90')

// ── Layer definitions ────────────────────────────────────────────────────────
// Each layer maps to an npm script, a glob, and a color. `needsForge` means
// we'll check the PATH for `forge`/`anvil` before running.
const LAYERS = [
  {
    key: 'unit',
    name: 'Unit',
    short: 'Pure logic + mocked viem. Fastest. No network.',
    long: 'Hermetic tests of business logic and our viem wrappers with viem mocked. Runs in jsdom.',
    npm: 'test:unit',
    globs: ['src/test/unit'],
    color: green,
    needsForge: false,
  },
  {
    key: 'contract',
    name: 'Contract (Solidity)',
    short: 'Foundry tests: mint/burn/fuzz/invariants in Solidity.',
    long: 'forge test — Solidity unit + fuzz (256 runs) + invariant tests against iqubeExtended.sol.',
    npm: 'test:contract',
    globs: ['contract/test'],
    color: blue,
    isSolidity: true,
    needsForge: true,
  },
  {
    key: 'integration',
    name: 'Integration',
    short: 'Real Anvil node, real transactions. Requires Foundry.',
    long: 'Spawns a local Anvil EVM, deploys iqubeExtended, runs full mint/burn through viem.',
    npm: 'test:integration',
    globs: ['src/test/integration'],
    color: magenta,
    needsForge: true,
  },
  {
    key: 'fault',
    name: 'Fault Injection',
    short: 'Simulated RPC failures: timeouts, reverts, chain mismatch.',
    long: 'Off-nominal / robustness tests. Confirms the system surfaces errors loudly, never silently.',
    npm: 'test:fault',
    globs: ['src/test/fault-injection'],
    color: yellow,
    needsForge: false,
  },
  {
    key: 'load',
    name: 'Load / Performance',
    short: 'Concurrent mint/burn on Anvil. Writes reports/*.json.',
    long: 'Throughput + latency envelope. Envvars: LOAD_OPS (default 200), LOAD_WORKERS (default 8).',
    npm: 'test:load',
    globs: ['src/test/load'],
    color: red,
    needsForge: true,
  },
  {
    key: 'coverage',
    name: 'Coverage (unit)',
    short: 'Unit tests + V8 line/branch coverage report.',
    long: 'Runs unit tests with coverage. Enforces thresholds. HTML report at coverage/index.html.',
    npm: 'test:coverage',
    globs: ['src/test/unit'],
    color: cyan,
    needsForge: false,
  },
  {
    key: 'all',
    name: 'All (regression)',
    short: 'unit + contract + integration + fault  (skips load).',
    long: 'Full regression suite: every layer except load.',
    npm: 'test:all',
    globs: ['src/test/unit', 'contract/test', 'src/test/integration', 'src/test/fault-injection'],
    color: bold,
    needsForge: true,
  },
]

// ── Test discovery ───────────────────────────────────────────────────────────
// Walk a directory, return absolute paths of test files.
function walk(dir, predicate) {
  const out = []
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    const s = statSync(p)
    if (s.isDirectory()) out.push(...walk(p, predicate))
    else if (predicate(p)) out.push(p)
  }
  return out
}

function testFilesFor(layer) {
  const files = []
  for (const g of layer.globs) {
    const abs = resolve(ROOT, g)
    if (layer.isSolidity) {
      files.push(...walk(abs, (p) => p.endsWith('.t.sol')))
    } else {
      files.push(
        ...walk(
          abs,
          (p) =>
            /\.(test|spec)\.(ts|tsx)$/.test(p) || p.endsWith('.load.ts'),
        ),
      )
    }
  }
  return files
}

// Extract test names from a file. For TS/JS: parse `it('...')`, `test('...')`.
// For Solidity: parse `function test...()`.
function parseTestsInFile(file) {
  const src = readFileSync(file, 'utf8')
  const tests = []
  if (file.endsWith('.sol')) {
    // Solidity: `function testSomething(...) ...`
    const re = /function\s+(test[A-Za-z0-9_]+|invariant_[A-Za-z0-9_]+|testFuzz_[A-Za-z0-9_]+)\s*\(/g
    let m
    while ((m = re.exec(src)) !== null) tests.push(m[1])
  } else {
    // TS/JS: it('...', ...) or test('...', ...)
    const re = /(?:^|\s)(?:it|test)\s*\(\s*(['"`])([^'"`]+?)\1/g
    let m
    while ((m = re.exec(src)) !== null) tests.push(m[2])
  }
  return tests
}

// Extract REQ-IDs. Handles both dash form (`REQ-MINT-001`, TS tests) and
// underscore form (`REQ_MINT_001`, Solidity tests). Also handles grouped
// IDs like `REQ-PERF-001/002/003`. Returned IDs are normalized to dash form.
// Matches REQ-FOO-001, REQ-LOGIC-RISK-002, REQ_MINT_001, REQ-PERF-001/002/003
const REQ_RE = /\bREQ(?:[-_][A-Z]+)+[-_]\d+(?:\/\d+)*\b/g
function extractReqs(s) {
  const matches = s.match(REQ_RE) ?? []
  return matches.map((m) => m.replace(/_/g, '-'))
}
// Same extraction, but when applied to full file source (to catch describe-
// block REQs and Solidity comment REQs that aren't in test names).
function extractReqsFromSource(src) {
  return extractReqs(src)
}

function statsFor(layer) {
  const files = testFilesFor(layer)
  let totalTests = 0
  const reqs = new Set()
  for (const f of files) {
    const src = readFileSync(f, 'utf8')
    const tests = parseTestsInFile(f)
    totalTests += tests.length
    // Scan the whole file so we catch REQs declared in describe blocks,
    // file-header comments, and Solidity function-name underscores.
    for (const r of extractReqsFromSource(src)) reqs.add(r)
  }
  return { fileCount: files.length, totalTests, reqCount: reqs.size, files, reqs: [...reqs] }
}

// ── PATH / Foundry check ─────────────────────────────────────────────────────
function ensureForgeOnPath() {
  // Extend PATH with ~/.foundry/bin so spawned processes can find forge/anvil.
  const home = process.env.HOME || process.env.USERPROFILE
  if (home) {
    const foundryBin = `${home}/.foundry/bin`
    if (!process.env.PATH?.split(':').includes(foundryBin)) {
      process.env.PATH = `${foundryBin}:${process.env.PATH ?? ''}`
    }
  }
}

// ── Runner ───────────────────────────────────────────────────────────────────
function runLayer(layer, extraArgs = []) {
  ensureForgeOnPath()
  const args = ['run', layer.npm]
  if (extraArgs.length) args.push('--', ...extraArgs)
  log()
  log(layer.color(bold(`▶ Running: ${layer.name}`)))
  log(dim(`  npm ${args.join(' ')}`))
  log()
  return new Promise((resolveP) => {
    const child = spawn('npm', args, { stdio: 'inherit', cwd: ROOT })
    child.on('exit', (code) => resolveP(code ?? 1))
  })
}

// ── Rendering ────────────────────────────────────────────────────────────────
const log = (...args) => console.log(...args)

function header(title) {
  const bar = '━'.repeat(Math.max(0, 64 - title.length - 2))
  log(bold(`\n━━ ${title} ${bar}`))
}

function renderMenu() {
  header('iQube Test CLI')
  log(dim('  Pick a layer to run. Each layer maps to an npm script.\n'))
  LAYERS.forEach((l, i) => {
    const s = statsFor(l)
    const count =
      l.key === 'all'
        ? gray(`  [aggregate]`)
        : gray(`  (${s.totalTests} tests in ${s.fileCount} files${s.reqCount ? `, ${s.reqCount} REQs` : ''})`)
    const num = yellow(`  ${i + 1})`)
    log(`${num} ${l.color(bold(l.name.padEnd(22)))}${count}`)
    log(dim(`      ${l.short}`))
  })
  log(yellow(`  ${LAYERS.length + 1})`) + '  ' + bold('List all tests') + gray('        (discover tests + REQ-IDs)'))
  log(yellow(`  ${LAYERS.length + 2})`) + '  ' + bold('Help'))
  log(yellow(`  q)`) + '  ' + dim('Quit'))
  log()
}

function renderList() {
  header('All tests, grouped by layer')
  const allReqs = new Set()
  for (const l of LAYERS) {
    if (l.key === 'all') continue
    const s = statsFor(l)
    s.reqs.forEach((r) => allReqs.add(r))
    const reqSuffix = s.reqCount ? gray(`, ${s.reqCount} REQs`) : ''
    log(l.color(bold(`\n${l.name}`)) + gray(`  —  ${s.totalTests} tests in ${s.fileCount} files${reqSuffix}`))
    for (const f of s.files) {
      const rel = relative(ROOT, f)
      const tests = parseTestsInFile(f)
      // REQs found in the source around each test line (describe blocks, etc.)
      const fileSrc = readFileSync(f, 'utf8')
      const fileReqs = extractReqsFromSource(fileSrc)
      const uniqFileReqs = [...new Set(fileReqs)]
      const fileReqHint = uniqFileReqs.length ? gray(`  [${uniqFileReqs.join(', ')}]`) : ''
      log(dim(`  ${rel}`) + fileReqHint)
      for (const t of tests) {
        const reqs = extractReqs(t)
        const tag = reqs.length ? cyan(`[${reqs.join(', ')}]`) + ' ' : ''
        log(`    ${gray('·')} ${tag}${t}`)
      }
    }
  }
  log()
  log(bold(`Total: ${allReqs.size} distinct REQ-IDs covered`))
  log(gray('  (See docs/TRACEABILITY.md for the canonical matrix.)'))
  log()
}

function renderShow(layer) {
  header(`${layer.name}`)
  log(layer.color(bold(layer.name)))
  log(`  ${layer.long}`)
  log(`  ${dim('npm script:')} ${cyan(layer.npm)}`)
  const s = statsFor(layer)
  log(`  ${dim('files:')} ${s.fileCount}`)
  log(`  ${dim('tests:')} ${s.totalTests}`)
  if (s.reqCount) log(`  ${dim('REQ-IDs:')} ${s.reqCount} ${gray('→')} ${s.reqs.sort().join(', ')}`)
  log()
  for (const f of s.files) {
    const rel = relative(ROOT, f)
    log(dim(`${rel}`))
    for (const t of parseTestsInFile(f)) {
      const reqs = extractReqs(t)
      const tag = reqs.length ? cyan(`[${reqs.join(', ')}]`) + ' ' : ''
      log(`  ${gray('·')} ${tag}${t}`)
    }
  }
  log()
}

function renderHelp() {
  header('Usage')
  log(`  ${cyan('./scripts/test-cli.mjs')} ${dim('[layer | command] [args...]')}\n`)
  log(bold('  Layers'))
  for (const l of LAYERS) log(`    ${l.color(l.key.padEnd(14))}${dim(l.short)}`)
  log()
  log(bold('  Commands'))
  log(`    ${yellow('list'.padEnd(14))}${dim('Enumerate every test + REQ-ID across all layers')}`)
  log(`    ${yellow('show <layer>'.padEnd(14))}${dim('Details for one layer (files, tests, REQs)')}`)
  log(`    ${yellow('help'.padEnd(14))}${dim('This message')}`)
  log()
  log(bold('  Examples'))
  log(`    ${dim('# interactive menu')}`)
  log(`    ./scripts/test-cli.mjs`)
  log(`    ${dim('# run one layer')}`)
  log(`    ./scripts/test-cli.mjs unit`)
  log(`    ./scripts/test-cli.mjs contract`)
  log(`    ${dim('# load with tuning')}`)
  log(`    LOAD_OPS=1000 LOAD_WORKERS=8 ./scripts/test-cli.mjs load`)
  log(`    ${dim('# list everything (no run)')}`)
  log(`    ./scripts/test-cli.mjs list`)
  log(`    ${dim('# detailed view of one layer')}`)
  log(`    ./scripts/test-cli.mjs show integration`)
  log()
  log(gray('  Also available: npm run t  (menu)  ·  npm run tests  (list)'))
  log()
}

// ── Interactive mode ─────────────────────────────────────────────────────────
function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolveP) => {
    rl.question(question, (ans) => {
      rl.close()
      resolveP(ans.trim())
    })
  })
}

async function interactive() {
  while (true) {
    renderMenu()
    const choice = await prompt(yellow('Choose> '))
    if (!choice) continue
    if (choice === 'q' || choice === 'quit' || choice === 'exit') return 0
    const n = Number(choice)
    if (Number.isInteger(n) && n >= 1 && n <= LAYERS.length) {
      const code = await runLayer(LAYERS[n - 1])
      log()
      log(code === 0 ? green(bold('✓ PASS')) : red(bold(`✗ FAIL (exit ${code})`)))
      const again = await prompt(dim('Press enter for menu, q to quit: '))
      if (again === 'q' || again === 'quit') return code
      continue
    }
    if (n === LAYERS.length + 1) { renderList(); await prompt(dim('Press enter to continue... ')); continue }
    if (n === LAYERS.length + 2) { renderHelp(); await prompt(dim('Press enter to continue... ')); continue }
    // Also accept layer keys typed directly
    const layer = LAYERS.find((l) => l.key === choice.toLowerCase())
    if (layer) {
      const code = await runLayer(layer)
      log(code === 0 ? green(bold('✓ PASS')) : red(bold(`✗ FAIL (exit ${code})`)))
      const again = await prompt(dim('Press enter for menu, q to quit: '))
      if (again === 'q' || again === 'quit') return code
      continue
    }
    log(red(`  ✗ unknown choice: ${choice}`))
  }
}

// ── Entry point ──────────────────────────────────────────────────────────────
async function main() {
  const [arg, ...rest] = process.argv.slice(2)
  if (!arg) {
    const code = await interactive()
    process.exit(code)
  }
  if (arg === 'help' || arg === '-h' || arg === '--help') {
    renderHelp()
    return
  }
  if (arg === 'list' || arg === 'ls') {
    renderList()
    return
  }
  if (arg === 'show') {
    const layer = LAYERS.find((l) => l.key === rest[0])
    if (!layer) {
      log(red(`✗ unknown layer: ${rest[0] ?? '(missing)'}`))
      log(dim(`  layers: ${LAYERS.map((l) => l.key).join(', ')}`))
      process.exit(2)
    }
    renderShow(layer)
    return
  }
  const layer = LAYERS.find((l) => l.key === arg)
  if (!layer) {
    log(red(`✗ unknown layer or command: ${arg}`))
    log(dim(`  try:  ./scripts/test-cli.mjs help`))
    process.exit(2)
  }
  const code = await runLayer(layer, rest)
  process.exit(code)
}

main().catch((err) => {
  console.error(red(bold('✗ CLI error:')), err)
  process.exit(1)
})
