import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('.', import.meta.url))
const packageName = '@davidggarber/puzzyl-kit'

function npm(args, cwd, capture = false) {
  const npmPath = process.env.npm_execpath
  if (!npmPath) {
    throw new Error('Run this script through npm run kit:local.')
  }

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [npmPath, ...args], {
      cwd,
      stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    })
    let output = ''
    if (capture) {
      child.stdout.setEncoding('utf8')
      child.stdout.on('data', chunk => { output += chunk })
    }
    child.on('error', reject)
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve(output)
      } else {
        reject(new Error(`npm ${args[0]} failed (${signal ?? `exit code ${code}`})`))
      }
    })
  })
}

let stagingDirectory
try {
  if (process.argv.length > 3) {
    throw new Error('Usage: npm run kit:local -- [path-to-puzzyl-kit]')
  }
  const kitRoot = path.resolve(process.argv[2] ?? path.join(repoRoot, '..', 'puzzyl-kit'))
  const manifest = JSON.parse(await readFile(path.join(kitRoot, 'package.json'), 'utf8'))
  if (manifest.name !== packageName) {
    throw new Error(`Expected ${packageName} at ${kitRoot}, found ${manifest.name}`)
  }

  console.log(`[kit:local] Building ${kitRoot}`)
  await npm(['run', 'build'], kitRoot)

  stagingDirectory = await mkdtemp(path.join(tmpdir(), 'puzzyl-kit-'))
  const packed = JSON.parse(await npm([
    'pack', '--json', '--ignore-scripts', '--pack-destination', stagingDirectory,
  ], kitRoot, true))
  if (packed.length !== 1 || typeof packed[0].filename !== 'string') {
    throw new Error('npm pack did not return exactly one package filename')
  }

  await npm([
    'install', '--no-save', '--package-lock=false', '--no-audit', '--no-fund',
    path.join(stagingDirectory, packed[0].filename),
  ], repoRoot)
  console.log(`[kit:local] Installed ${packageName}@${manifest.version} from ${kitRoot}`)
  console.log('[kit:local] Run npm run build to refresh the deployable bundle. Run npm ci to restore published dependencies.')
} catch (error) {
  console.error(`[kit:local] FAILURE: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
} finally {
  if (stagingDirectory) {
    await rm(stagingDirectory, { recursive: true, force: true })
  }
}
