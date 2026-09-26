// Mehrzad ArianMehr©
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { db } from '@/lib/db'

const execFileAsync = promisify(execFile)

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

const IMAGE_SIZES = new Set([
  '1024x1024',
  '768x1344',
  '864x1152',
  '1344x768',
  '1152x864',
  '1440x720',
  '720x1440',
])

/**
 * Run the `z-ai` CLI to generate an image. The SDK's
 * images.generations.create() hangs in this runtime, but the CLI works
 * reliably (~5–10s) and writes the file directly.
 */
async function generateImageViaCli(
  prompt: string,
  size: string,
  outPath: string
): Promise<{ bytes: number }> {
  await execFileAsync(
    'z-ai',
    ['image', '-p', prompt, '-o', outPath, '-s', size],
    { timeout: 90_000, maxBuffer: 10 * 1024 * 1024 }
  )
  const buf = await readFile(outPath)
  return { bytes: buf.length }
}

/**
 * Run the `z-ai` CLI to generate a video (async task + auto-poll).
 * Writes a JSON result file we parse for the video URL.
 */
async function generateVideoViaCli(
  prompt: string,
  duration: number,
  quality: string,
  resultPath: string
): Promise<{ videoUrl: string | null; status: string }> {
  try {
    await execFileAsync(
      'z-ai',
      [
        'video',
        '-p',
        prompt,
        '--quality',
        quality,
        '--duration',
        String(duration),
        '--poll',
        '--max-polls',
        '24',
        '--poll-interval',
        '5',
        '-o',
        resultPath,
      ],
      { timeout: 150_000, maxBuffer: 10 * 1024 * 1024 }
    )
  } catch {
    // the CLI may exit non-zero even when it wrote a partial result file
  }
  try {
    const raw = await readFile(resultPath, 'utf-8')
    const parsed = JSON.parse(raw)
    const status =
      parsed.task_status ||
      parsed.status ||
      (parsed.video_result?.[0]?.url ? 'SUCCESS' : 'UNKNOWN')
    const url =
      parsed.video_result?.[0]?.url ||
      parsed.video_url ||
      parsed.url ||
      parsed.video ||
      null
    return { videoUrl: url, status }
  } catch {
    return { videoUrl: null, status: 'NO_RESULT' }
  }
}

/**
 * POST /api/skills/invoke
 * Body: { chatId, skill: 'image' | 'video', prompt, size?, duration?, quality? }
 *
 * 1. Saves a user message recording the slash-command invocation.
 * 2. Generates the media via the `z-ai` CLI (image: sync; video: async+poll).
 * 3. Saves an assistant message with the generated media as an attachment.
 * 4. Returns { userMessage, assistantMessage }.
 */
export async function POST(req: NextRequest) {
  let chatId = ''
  let skill = ''
  let prompt = ''
  let size = '1024x1024'
  let duration = 5
  let quality: 'speed' | 'quality' = 'speed'

  try {
    const body = await req.json()
    chatId = String(body.chatId ?? '')
    skill = String(body.skill ?? '')
    prompt = String(body.prompt ?? '').trim()
    if (typeof body.size === 'string' && IMAGE_SIZES.has(body.size)) {
      size = body.size
    }
    if (typeof body.duration === 'number' && (body.duration === 5 || body.duration === 10)) {
      duration = body.duration
    }
    if (body.quality === 'quality') quality = 'quality'
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!chatId || !skill || !prompt) {
    return NextResponse.json(
      { error: 'chatId, skill and prompt are required' },
      { status: 400 }
    )
  }

  if (skill !== 'image' && skill !== 'video') {
    return NextResponse.json({ error: `Unknown skill: ${skill}` }, { status: 400 })
  }

  const chat = await db.chat.findUnique({ where: { id: chatId } })
  if (!chat) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
  }

  await mkdir(UPLOAD_DIR, { recursive: true })

  // 1. Save the user message (the slash command)
  const userContent = skill === 'image' ? `/image ${prompt}` : `/video ${prompt}`
  const userMessage = await db.message.create({
    data: { chatId, role: 'user', content: userContent },
  })

  let assistantContent = ''
  let attachmentJson: string | null = null

  try {
    if (skill === 'image') {
      const id = randomUUID()
      const filename = `${id}.png`
      const outPath = path.join(UPLOAD_DIR, filename)
      const { bytes } = await generateImageViaCli(prompt, size, outPath)
      const url = `/uploads/${filename}`
      assistantContent = `Here's the image I generated for **"${prompt}"**:`
      attachmentJson = JSON.stringify([
        {
          id,
          url,
          name: `${prompt.slice(0, 24) || 'image'}.png`,
          type: 'image/png',
          size: bytes,
          isImage: true,
        },
      ])
    } else {
      const resultPath = path.join(UPLOAD_DIR, `${randomUUID()}.json`)
      const { videoUrl, status } = await generateVideoViaCli(
        prompt,
        duration,
        quality,
        resultPath
      )
      if (!videoUrl) {
        assistantContent = `⚠️ Video generation didn't finish in time (status: ${status}). The video model can be slow — please try again, possibly with a shorter prompt or 5s duration.`
      } else {
        assistantContent = `Here's the video I generated for **"${prompt}"** (${duration}s, ${quality} mode):`
        attachmentJson = JSON.stringify([
          {
            id: randomUUID(),
            url: videoUrl,
            name: `${prompt.slice(0, 24) || 'video'}.mp4`,
            type: 'video/mp4',
            size: 0,
            isImage: false,
            isVideo: true,
          },
        ])
      }
    }
  } catch (e) {
    assistantContent = `⚠️ ${
      skill === 'image' ? 'Image' : 'Video'
    } generation failed: ${e instanceof Error ? e.message : 'Unknown error'}`
  }

  // 3. Save the assistant message
  const assistantMessage = await db.message.create({
    data: {
      chatId,
      role: 'assistant',
      content: assistantContent,
      attachments: attachmentJson,
    },
  })

  // 4. Touch the chat so it floats to the top
  await db.chat.update({ where: { id: chatId }, data: {} })

  return NextResponse.json({ userMessage, assistantMessage })
}
