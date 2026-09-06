import { spawn } from 'node:child_process'
import { copyFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const startedAt = Date.now()

function elapsedSince(timestamp) {
  return `${((Date.now() - timestamp) / 1000).toFixed(1)}s`
}

async function runPhase(name, action) {
  const phaseStartedAt = Date.now()
  console.log(`[build] ${name}...`)

  const heartbeat = setInterval(() => {
    console.log(`[build] ${name} still running (${elapsedSince(phaseStartedAt)})...`)
  }, 5000)

  try {
    await action()
    console.log(`[build] ${name} complete (${elapsedSince(phaseStartedAt)})`)
  } finally {
    clearInterval(heartbeat)
  }
}

function compileTypeScript() {
  const compilerPath = fileURLToPath(new URL('./node_modules/typescript/bin/tsc', import.meta.url))

  return new Promise((resolve, reject) => {
    const compiler = spawn(process.execPath, [compilerPath, '-p', 'tsconfig.build.json'], {
      stdio: 'inherit',
    })

    compiler.on('error', reject)
    compiler.on('exit', (code, signal) => {
      if (code === 0) {
        resolve()
      } else if (signal) {
        reject(new Error(`TypeScript compiler stopped by signal ${signal}`))
      } else {
        reject(new Error(`TypeScript compiler exited with code ${code}`))
      }
    })
  })
}

try {
  console.log('[build] Starting build')
  await runPhase('Compiling TypeScript', compileTypeScript)
  await runPhase('Copying puzzyl-kit bundle', () => copyFile(
    'node_modules/@davidggarber/puzzyl-kit/dist/kit.umd.js',
    'src/kit.umd.js',
  ))
  console.log(`[build] SUCCESS (${elapsedSince(startedAt)})`)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[build] FAILURE (${elapsedSince(startedAt)}): ${message}`)
  process.exitCode = 1
}