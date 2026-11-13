// Local stand-in for Vercel's static serving, driven by the real frontend/vercel.json. It applies
// `rewrites`, sends `headers` and serves `outputDirectory` so the deploy contract can be tested
// without a Vercel account. Development helper only; it is not part of the deployed site.
import { createReadStream, existsSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize, sep } from 'node:path'

const root = process.cwd()
const config = JSON.parse(await readFile(join(root, 'vercel.json'), 'utf8'))
const outputDir = join(root, config.outputDirectory ?? '.')
const port = Number(process.env.PORT ?? 4174)

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
}

// Only the `/(.*)`-style patterns used by this file are supported.
const matches = (source, pathname) =>
  new RegExp(`^${source.replace('/(.*)', '/(.*)')}$`).test(pathname)

const existingFile = (pathname) => {
  const file = normalize(join(outputDir, decodeURIComponent(pathname)))
  if (!file.startsWith(outputDir + sep)) return null
  return existsSync(file) && statSync(file).isFile() ? file : null
}

createServer((request, response) => {
  const { pathname } = new URL(request.url, 'http://localhost')
  const headers = {}
  for (const rule of config.headers ?? []) {
    if (matches(rule.source, pathname)) {
      for (const { key, value } of rule.headers) headers[key] = value
    }
  }

  const file =
    existingFile(pathname) ??
    existingFile((config.rewrites?.[0]?.destination ?? '/index.html').replace('(.*)', ''))
  if (!file) {
    response.writeHead(404, { ...headers, 'content-type': 'text/plain' }).end('not found')
    return
  }

  response.writeHead(200, {
    ...headers,
    'content-type': contentTypes[extname(file)] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  })
  if (request.method === 'HEAD') return response.end()
  createReadStream(file).pipe(response)
}).listen(port, '127.0.0.1', () => {
  console.log(`serving ${outputDir} with vercel.json rules on http://127.0.0.1:${port}`)
})
