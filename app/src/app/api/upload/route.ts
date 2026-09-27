// Mehrzad ArianMehr©
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { writeFile, mkdir, readFile } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

// Mehrzad ArianMehr©
// POST /api/upload — multipart file upload, 50MB max.
// Images larger than 5MB are auto-compressed to ≤5MB (saves VLM tokens).

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
const MAX_SIZE = 50 * 1024 * 1024 // 50 MB
const COMPRESS_THRESHOLD = 5 * 1024 * 1024 // 5 MB — compress images above this
const COMPRESS_TARGET = 4.5 * 1024 * 1024 // target under 5 MB after compression

const ALLOWED = new Set([
  'image/png', 'image/jpeg', 'image/jpg', 'image/gif',
  'image/webp', 'image/bmp', 'text/plain', 'text/markdown',
  'application/pdf',
])

const EXT_BY_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/bmp': 'bmp',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'application/pdf': 'pdf',
}

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/bmp'])

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
        {
          error: `Unsupported file type: ${file.type || 'unknown'}. Allowed: images (png/jpg/gif/webp/bmp), text/markdown, pdf.`,
        },
        { status: 415 }
      )
    }

    await mkdir(UPLOAD_DIR, { recursive: true })

    const isImage = IMAGE_TYPES.has(file.type)
    const ext = EXT_BY_TYPE[file.type] || 'bin'
    const id = randomUUID()

    let filename: string
    let bytes: Buffer
    let size: number

    if (isImage && file.size > COMPRESS_THRESHOLD) {
      // compress the image to ≤5MB
      const rawBuf = Buffer.from(await file.arrayBuffer())
      let compressed = await compressImage(rawBuf, file.type)

      // if still too big, progressively reduce quality more aggressively
      let quality = 80
      while (compressed.length > COMPRESS_TARGET && quality > 20) {
        quality -= 15
        compressed = await compressImage(rawBuf, file.type, quality, 1600)
      }
      // last resort: resize to 800px
      if (compressed.length > COMPRESS_TARGET) {
        compressed = await compressImage(rawBuf, file.type, 50, 800)
      }

      // use webp for best compression ratio (unless it was originally png)
      filename = `${id}.webp`
      bytes = compressed
      size = compressed.length
    } else {
      // no compression needed (under 5MB or not an image)
      const rawBuf = Buffer.from(await file.arrayBuffer())
      filename = `${id}.${ext}`
      bytes = rawBuf
      size = rawBuf.length
    }

    await writeFile(path.join(UPLOAD_DIR, filename), bytes)

    const url = `/uploads/${filename}`
    const compressed = isImage && file.size > COMPRESS_THRESHOLD

    return NextResponse.json(
      {
        attachment: {
          id,
          url,
          name: file.name || filename,
          type: isImage && compressed ? 'image/webp' : file.type,
          size,
          isImage,
          originalSize: file.size,
          compressed,
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

/**
 * Compress an image buffer using sharp. Outputs WebP for best ratio.
 */
async function compressImage(
  buf: Buffer,
  mimeType: string,
  quality = 80,
  maxDimension = 1920
): Promise<Buffer> {
  let img = sharp(buf, {
    // tell sharp the input format for animated/odd formats
    animated: mimeType === 'image/gif',
  })

  // resize if larger than maxDimension (maintains aspect ratio)
  img = img.resize(maxDimension, maxDimension, {
    fit: 'inside',
    withoutEnlargement: true,
  })

  // output as webp for best compression (or png for transparency-heavy)
  img = img.webp({ quality })

  return img.toBuffer()
}
