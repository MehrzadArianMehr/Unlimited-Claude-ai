import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// Mehrzad ArianMehr©
// POST /api/upload — multipart file upload (images/text/pdf), saves to public/uploads/.

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
const MAX_SIZE = 8 * 1024 * 1024

const ALLOWED = new Set([
  'image/png', 'image/jpeg', 'image/jpg', 'image/gif',
  'image/webp', 'image/bmp', 'text/plain', 'text/markdown',
  'application/pdf',
])

const EXT_BY_TYPE: Record<string, string> = {
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg',
  'image/gif': 'gif', 'image/webp': 'webp', 'image/bmp': 'bmp',
  'text/plain': 'txt', 'text/markdown': 'md', 'application/pdf': 'pdf',
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided. Send multipart/form-data with a "file" field.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File too large. Max ${MAX_SIZE / 1024 / 1024}MB.` },
        { status: 413 }
      )
    }

    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type || 'unknown'}. Allowed: images (png/jpg/gif/webp/bmp), text/markdown, pdf.` },
        { status: 415 }
      )
    }

    await mkdir(UPLOAD_DIR, { recursive: true })

    const ext = EXT_BY_TYPE[file.type] ?? 'bin'
    const id = randomUUID()
    const filename = `${id}.${ext}`
    const filepath = path.join(UPLOAD_DIR, filename)

    const bytes = await file.arrayBuffer()
    await writeFile(filepath, Buffer.from(bytes))

    const url = `/uploads/${filename}`
    const isImage = file.type.startsWith('image/')

    return NextResponse.json(
      {
        attachment: {
          id,
          url,
          name: file.name || filename,
          type: file.type,
          size: file.size,
          isImage,
        },
      },
      { status: 201 }
    )
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
