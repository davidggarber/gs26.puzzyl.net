import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SITE_ROOT = fileURLToPath(new URL('./src', import.meta.url))
const REPO_ROOT = fileURLToPath(new URL('.', import.meta.url))
const PREFERRED_PORT = Number(process.env.PORT ?? 3000)
const KIT_ALIAS = '/node_modules/@davidggarber/puzzyl-kit/dist/kit.umd.js'
const KIT_SRC_ALIAS = '/__puzzyl-kit-src/'
const DEV_MODE = (process.env.PUZZYL_DEV_MODE ?? '').toLowerCase()
const IS_ALPHA = DEV_MODE === 'alpha'
const ALPHA_KIT_DIST = process.env.PUZZYL_KIT_DIST ?? 'D:\\git\\puzzyl-kit\\dist'
const ALPHA_KIT_SRC = process.env.PUZZYL_KIT_SRC ?? 'D:\\git\\puzzyl-kit\\src'
let ACTIVE_PORT = PREFERRED_PORT
let announcedReady = false

const MIME = {
  '.xhtml': 'application/xhtml+xml; charset=utf-8',
  '.html':  'text/html; charset=utf-8',
  '.js':    'text/javascript; charset=utf-8',
  '.mjs':   'text/javascript; charset=utf-8',
  '.css':   'text/css; charset=utf-8',
  '.ts':    'text/plain; charset=utf-8',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.svg':   'image/svg+xml',
  '.ico':   'image/x-icon',
  '.json':  'application/json',
  '.map':   'application/json',
}

function isWithinRoot(candidatePath, rootPath) {
  const normalizedCandidate = path.resolve(candidatePath).toLowerCase()
  const normalizedRoot = path.resolve(rootPath).toLowerCase()
  return normalizedCandidate === normalizedRoot || normalizedCandidate.startsWith(`${normalizedRoot}${path.sep}`)
}

async function readAlphaKitSourceMap(mapPath) {
  const originalMap = JSON.parse(await fs.readFile(mapPath, 'utf8'))
  const rewrittenMap = {
    ...originalMap,
    sourceRoot: '',
    sources: (originalMap.sources ?? []).map((sourcePath) => {
      const sourceName = sourcePath.replace(/^\.\.\/src\//, '')
      return `${KIT_SRC_ALIAS}${sourceName}`
    }),
  }
  delete rewrittenMap.sourcesContent
  return Buffer.from(JSON.stringify(rewrittenMap), 'utf8')
}

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = new URL(req.url ?? '/', 'http://localhost').pathname

    if (IS_ALPHA && urlPath.startsWith(KIT_SRC_ALIAS)) {
      const relativeSourcePath = urlPath.slice(KIT_SRC_ALIAS.length)
      const candidatePath = path.resolve(ALPHA_KIT_SRC, relativeSourcePath)
      if (!isWithinRoot(candidatePath, ALPHA_KIT_SRC)) {
        res.writeHead(403); res.end('Forbidden'); return
      }

      const content = await fs.readFile(candidatePath)
      const ext = path.extname(candidatePath).toLowerCase()
      res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' })
      res.end(content)
      return
    }

    const isKitRequest = urlPath === '/kit.umd.js' || urlPath === '/kit.umd.js.map'
    const sourceMapSuffix = urlPath.endsWith('.map') ? '.map' : ''
    const candidatePaths = []

    if (isKitRequest) {
      if (IS_ALPHA) {
        const alphaKitPath = path.join(ALPHA_KIT_DIST, `kit.umd.js${sourceMapSuffix}`)
        if (sourceMapSuffix === '.map') {
          const content = await readAlphaKitSourceMap(alphaKitPath)
          res.writeHead(200, { 'Content-Type': MIME['.map'] })
          res.end(content)
          return
        }
        candidatePaths.push(alphaKitPath)
      }
      candidatePaths.push(path.resolve(REPO_ROOT, `.${KIT_ALIAS}${sourceMapSuffix}`))
    } else {
      // Serve from src/ first; fall back to repo root (for node_modules etc.)
      const sitePath = path.resolve(SITE_ROOT, '.' + urlPath)
      const repoPath = path.resolve(REPO_ROOT, '.' + urlPath)

      if (!sitePath.startsWith(SITE_ROOT) && !repoPath.startsWith(REPO_ROOT)) {
        res.writeHead(403); res.end('Forbidden'); return
      }

      candidatePaths.push(sitePath, repoPath)
    }

    let content
    for (const candidatePath of candidatePaths) {
      try {
        content = await fs.readFile(candidatePath)
        break
      } catch {
        // Try next candidate path.
      }
    }

    if (!content) {
      const notFoundError = new Error('Not found')
      notFoundError.code = 'ENOENT'
      throw notFoundError
    }

    const ext = path.extname(urlPath).toLowerCase()
    res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' })
    res.end(content)
  } catch (err) {
    res.writeHead(err.code === 'ENOENT' ? 404 : 500)
    res.end(err.code === 'ENOENT' ? 'Not found' : 'Server error')
  }
})

async function onServerReady() {
  if (announcedReady) {
    return
  }
  announcedReady = true
  console.log(`Dev server: http://127.0.0.1:${ACTIVE_PORT}`)
  if (ACTIVE_PORT !== PREFERRED_PORT) {
    console.log(`Note: ${PREFERRED_PORT} was busy, using ${ACTIVE_PORT}`)
  }
  if (IS_ALPHA) {
    console.log(`Alpha mode: /kit.umd.js -> ${ALPHA_KIT_DIST}`)
    console.log(`Alpha source map: ${KIT_SRC_ALIAS}* -> ${ALPHA_KIT_SRC}`)
  }
  const entries = await fs.readdir(SITE_ROOT)
  for (const name of entries.filter(n => n.endsWith('.html')).sort()) {
    console.log(` >> http://127.0.0.1:${ACTIVE_PORT}/${name}`)
  }
  for (const name of entries.filter(n => n.endsWith('.xhtml')).sort()) {
    console.log(` >> http://127.0.0.1:${ACTIVE_PORT}/${name}`)
  }
}

function listenOnPort(port) {
  ACTIVE_PORT = port
  server.listen(port, '127.0.0.1', onServerReady)
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    // Try the next localhost port automatically in dev mode.
    listenOnPort(ACTIVE_PORT + 1)
    return
  }
  throw err
})

listenOnPort(PREFERRED_PORT)
