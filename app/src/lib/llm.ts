// Mehrzad ArianMehr©
import ZAI from 'z-ai-web-dev-sdk'
import { readFile } from 'fs/promises'
import path from 'path'

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

export async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type AttachmentRef = {
  id: string
  url: string // relative path like /uploads/xxx.png
  name: string
  type: string // mime type
  size: number
  isImage?: boolean
}

const SYSTEM_PROMPT =
  'You are "Unlimited Claude", a helpful, friendly and knowledgeable AI assistant. ' +
  'You answer clearly and concisely, use Markdown when useful, and stay safe and respectful.' +
  ' When the user attaches an image, look at it carefully and describe or reason about what is shown.'

/**
 * Read an uploaded image file from disk and return a base64 data URL.
 */
async function readImageAsDataUrl(url: string): Promise<string | null> {
  try {
    // url looks like /uploads/abc.png
    const rel = url.replace(/^\/+/, '')
    const filepath = path.join(process.cwd(), 'public', rel)
    const buf = await readFile(filepath)
    const ext = path.extname(filepath).slice(1).toLowerCase()
    const mime =
      ext === 'png'
        ? 'image/png'
        : ext === 'jpg' || ext === 'jpeg'
        ? 'image/jpeg'
        : ext === 'gif'
        ? 'image/gif'
        : ext === 'webp'
        ? 'image/webp'
        : ext === 'bmp'
        ? 'image/bmp'
        : 'image/png'
    return `data:${mime};base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

/**
 * Get a chat completion from the LLM, given the conversation history.
 * Returns the assistant's text reply.
 *
 * If the latest user turn carries image attachments, the request is routed
 * through the vision endpoint with the images embedded as data URLs.
 */
export async function getChatReply(
  history: ChatMessage[],
  options?: {
    /** Attachments belonging to the LAST user message in history */
    lastUserAttachments?: AttachmentRef[]
  }
): Promise<string> {
  const zai = await getZAI()

  const imgs = (options?.lastUserAttachments ?? []).filter((a) => a.isImage)

  // Find the last user message content (for the vision prompt text)
  const lastUser = [...history].reverse().find((m) => m.role === 'user')
  const userText = lastUser?.content ?? '(no text)'

  // ---- Vision path: at least one image on the latest user turn ----
  if (imgs.length > 0 && lastUser) {
    const dataUrls: string[] = []
    for (const img of imgs) {
      const du = await readImageAsDataUrl(img.url)
      if (du) dataUrls.push(du)
    }

    if (dataUrls.length > 0) {
      // Build a vision message: text + N images, all as the latest user turn.
      // Prior context is included as plain text turns so the model has history.
      const priorMessages = history.slice(0, -1).map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const lastUserContent: Array<
        | { type: 'text'; text: string }
        | { type: 'image_url'; image_url: { url: string } }
      > = []
      lastUserContent.push({ type: 'text', text: userText })
      for (const du of dataUrls) {
        lastUserContent.push({ type: 'image_url', image_url: { url: du } })
      }

      try {
        const vision = await zai.chat.completions.createVision({
          messages: [
            { role: 'assistant', content: SYSTEM_PROMPT },
            ...priorMessages,
            { role: 'user', content: lastUserContent },
          ],
          thinking: { type: 'disabled' },
        })
        const reply = vision.choices[0]?.message?.content ?? ''
        return reply.trim()
      } catch {
        // fall through to text path on vision failure
      }
    }
  }

  // ---- Text-only path ----
  const messages = [
    { role: 'assistant' as const, content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ]

  const completion = await zai.chat.completions.create({
    messages,
    thinking: { type: 'disabled' },
  })

  const reply = completion.choices[0]?.message?.content ?? ''
  return reply.trim()
}

/**
 * Generate a short title for a chat based on the first user message.
 */
export async function generateChatTitle(firstUserMessage: string): Promise<string> {
  const zai = await getZAI()
  try {
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content:
            'You generate very short chat titles (max 5 words, no quotes, no punctuation at the end). ' +
            'Respond with the title only.',
        },
        {
          role: 'user',
          content: `Create a 3-5 word title for a chat that starts with this message:\n\n${firstUserMessage}`,
        },
      ],
      thinking: { type: 'disabled' },
    })
    const title = (completion.choices[0]?.message?.content ?? '').trim()
    // Clean up: remove quotes, newlines, trailing punctuation
    const cleaned = title
      .replace(/^["'`]+|["'`]+$/g, '')
      .replace(/\n+/g, ' ')
      .replace(/[.!?]+$/g, '')
      .trim()
    return cleaned.slice(0, 60) || firstUserMessage.slice(0, 40)
  } catch {
    return firstUserMessage.slice(0, 40)
  }
}
