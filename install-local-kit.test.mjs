import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFile, lstat, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'

const packageName = '@davidggarber/puzzyl-kit'

function npm(cwd, args) {
  assert.ok(process.env.npm_execpath, 'Run tests with npm run test:kit-local')
  const result = spawnSync(process.execPath, [process.env.npm_execpath, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, npm_config_offline: 'true' },
  })
  assert.ifError(result.error)
  return result
}

function succeeds(result) {
  assert.equal(result.status, 0, result.stdout + result.stderr)
}

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'kit-local-test-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const consumer = path.join(root, 'event')
  const kit = path.join(root, 'puzzyl-kit')
  await mkdir(consumer)
  await mkdir(kit)
  await copyFile(new URL('./install-local-kit.mjs', import.meta.url), path.join(consumer, 'install-local-kit.mjs'))
  await writeFile(path.join(consumer, 'package.json'), JSON.stringify({
    name: 'kit-local-test-event',
    private: true,
    scripts: { 'kit:local': 'node install-local-kit.mjs' },
  }))
  await writeFile(path.join(kit, 'package.json'), JSON.stringify({
    name: packageName,
    version: '0.1.19',
    files: ['dist'],
    types: 'dist/index.d.ts',
    scripts: { build: 'node build.mjs' },
  }))
  await writeFile(path.join(kit, 'build.mjs'), `
import { mkdirSync, copyFileSync } from 'node:fs'
mkdirSync('dist', { recursive: true })
copyFileSync('patch.txt', 'dist/kit.umd.js')
copyFileSync('patch.txt', 'dist/index.d.ts')
`)
  await writeFile(path.join(kit, 'patch.txt'), 'published snapshot')
  return { root, consumer, kit }
}

test('installs fresh snapshots at the same version without changing manifests; npm ci restores the lock', async t => {
  const { root, consumer, kit } = await fixture(t)
  succeeds(npm(kit, ['run', 'build']))
  const pack = npm(kit, ['pack', '--json', '--pack-destination', root])
  succeeds(pack)
  const originalTarball = path.join(root, JSON.parse(pack.stdout)[0].filename)
  succeeds(npm(consumer, ['install', '--no-audit', '--no-fund', originalTarball]))
  const manifestPath = path.join(consumer, 'package.json')
  const lockPath = path.join(consumer, 'package-lock.json')
  const manifest = await readFile(manifestPath, 'utf8')
  const lock = await readFile(lockPath, 'utf8')
  const installed = path.join(consumer, 'node_modules', '@davidggarber', 'puzzyl-kit')

  for (const [index, patch] of ['first local patch', 'second local patch'].entries()) {
    await writeFile(path.join(kit, 'patch.txt'), patch)
    // Exercise both the adjacent default and an explicit path containing spaces.
    const checkout = path.join(root, 'custom kit checkout')
    if (index === 1) {
      await mkdir(checkout)
      for (const file of ['package.json', 'build.mjs', 'patch.txt']) {
        await copyFile(path.join(kit, file), path.join(checkout, file))
      }
    }
    succeeds(npm(consumer, ['run', 'kit:local', ...(index === 1 ? ['--', checkout] : [])]))
    assert.equal(await readFile(path.join(installed, 'dist', 'kit.umd.js'), 'utf8'), patch)
    assert.equal(await readFile(path.join(installed, 'dist', 'index.d.ts'), 'utf8'), patch)
    assert.equal((await lstat(installed)).isSymbolicLink(), false)
    assert.equal(await readFile(manifestPath, 'utf8'), manifest)
    assert.equal(await readFile(lockPath, 'utf8'), lock)
  }

  succeeds(npm(consumer, ['ci', '--no-audit', '--no-fund']))
  assert.equal(await readFile(path.join(installed, 'dist', 'kit.umd.js'), 'utf8'), 'published snapshot')
})

test('reports invalid checkouts and build failures without installing', async t => {
  const { consumer, kit } = await fixture(t)
  const missing = npm(consumer, ['run', 'kit:local', '--', path.join(kit, 'missing')])
  assert.notEqual(missing.status, 0)
  assert.match(missing.stderr, /\[kit:local\] FAILURE:.*ENOENT/)

  const wrongPackage = npm(consumer, ['run', 'kit:local', '--', consumer])
  assert.notEqual(wrongPackage.status, 0)
  assert.match(wrongPackage.stderr, /Expected @davidggarber\/puzzyl-kit/)

  await writeFile(path.join(kit, 'build.mjs'), 'process.exit(7)')
  const failedBuild = npm(consumer, ['run', 'kit:local'])
  assert.notEqual(failedBuild.status, 0)
  assert.match(failedBuild.stderr, /npm run failed/)
  await assert.rejects(lstat(path.join(consumer, 'node_modules')), { code: 'ENOENT' })
})
