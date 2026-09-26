// Mehrzad ArianMehr©
import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

const FILE_PATH = path.join(process.cwd(), 'public', 'unlimited-claude.zip')
const FILENAME = 'unlimited-claude.zip'

/**
 * GET /api/download/zip
 *
 * Streams the packaged project zip with explicit attachment headers so the
 * browser reliably downloads it as `unlimited-claude.zip` (and nothing — no
 * gateway, no Next.js static handler — rewrites the content-type or strips
 * the Content-Disposition). No compression is applied on top of the already-
 * deflated zip.
 */
export async function GET() {
  let buf: Buffer
  try {
    buf = await readFile(FILE_PATH)
  } catch {
    return NextResponse.json(
      { error: 'Project archive not found on disk.' },
      { status: 404 }
    )
  }

  // Return raw bytes with headers that force a download. Using a Uint8Array
  // body avoids any JSON/string coercion.
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${FILENAME}"`,
      'Content-Length': String(buf.length),
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      // discourage any intermediate from re-encoding the body
      'Content-Encoding': 'identity',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
