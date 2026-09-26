// Mehrzad ArianMehr©
// Cross-platform postbuild: copies static assets into the standalone output
// dir so `bun .next/standalone/server.js` serves images/css correctly.
// (Replaces the Unix-only `cp -r` in package.json so build works on Windows too.)
import { cpSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const cwd = process.cwd()
const standalone = join(cwd, '.next', 'standalone')
const staticDir = join(cwd, '.next', 'static')
const publicDir = join(cwd, 'public')

if (!existsSync(standalone)) {
  console.error('[postbuild] .next/standalone not found — did `next build` run?')
  process.exit(1)
}

// .next/standalone/.next/static
const targetStatic = join(standalone, '.next', 'static')
mkdirSync(join(standalone, '.next'), { recursive: true })
if (existsSync(staticDir)) {
  cpSync(staticDir, targetStatic, { recursive: true })
  console.log('[postbuild] copied .next/static ->', targetStatic)
}

// .next/standalone/public
if (existsSync(publicDir)) {
  cpSync(publicDir, join(standalone, 'public'), { recursive: true })
  console.log('[postbuild] copied public ->', join(standalone, 'public'))
}

console.log('[postbuild] done.')
