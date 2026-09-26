// Mehrzad ArianMehr©
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  getChatReply,
  generateChatTitle,
  type ChatMessage,
  type AttachmentRef,
} from '@/lib/llm'

type RouteParams = { params: Promise<{ id: string }> }

/**
 * POST /api/chats/[id]/messages
 * Body: { content: string, attachments?: AttachmentRef[] }
 *
 * 1. Saves the user's message (with attachment metadata as JSON)
 * 2. Loads the full conversation history
 * 3. Calls the LLM (vision path if the latest user message has images)
 * 4. Saves the assistant reply
 * 5. If this is the first user message, auto-generate a chat title
 * 6. Returns the user message, assistant message, and optional new title
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id } = await params

  let content = ''
  let attachments: AttachmentRef[] = []
  try {
    const body = await req.json()
    if (typeof body?.content === 'string') content = body.content.trim()
    if (Array.isArray(body?.attachments)) {
      attachments = (body.attachments as AttachmentRef[]).filter(
        (a) => a && typeof a.url === 'string' && typeof a.name === 'string'
      )
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Allow an image-only message (no text) — but require either text or an attachment
  if (!content && attachments.length === 0) {
    return NextResponse.json(
      { error: 'Content or at least one attachment is required' },
      { status: 400 }
    )
  }

  // Make sure the chat exists
  const chat = await db.chat.findUnique({ where: { id } })
  if (!chat) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
  }

  const finalContent = content || '(image attached)'
  const attachmentsJson =
    attachments.length > 0 ? JSON.stringify(attachments) : null

  // 1. Save the user message
  const userMessage = await db.message.create({
    data: {
      chatId: id,
      role: 'user',
      content: finalContent,
      attachments: attachmentsJson,
    },
  })

  // 2. Load full conversation history (for LLM context)
  const allMessages = await db.message.findMany({
    where: { chatId: id },
    orderBy: { createdAt: 'asc' },
    select: { role: true, content: true, attachments: true },
  })

  const history: ChatMessage[] = allMessages.map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content,
  }))

  // 3. Call the LLM — pass the latest user message's image attachments.
  // If the z-ai SDK isn't available (e.g. no credentials outside the
  // sandbox), gracefully fall back to a canned reply so the chat UI keeps
  // working instead of returning a 502.
  let assistantContent: string
  let fellBack = false
  try {
    assistantContent = await getChatReply(history, {
      lastUserAttachments: attachments,
    })
  } catch (e) {
    fellBack = true
    const reason = e instanceof Error ? e.message : 'Unknown error'
    assistantContent =
      `> ⚠️ **AI backend unavailable** (${reason}).\n>\n> This is a demo build of **Unlimited Claude**. The full AI model needs credentials that aren't configured on this machine.\n>\n> You said: *${content.replace(/\n+/g, ' ')}*.\n>\n> To enable real AI replies, either run this app in the Z.ai sandbox, or sign in with **Puter** (bottom of the sidebar) — Puter provides free unlimited Claude access via your own account.`
  }

  // Fallback if empty
  if (!assistantContent) {
    assistantContent =
      "I'm sorry, I couldn't generate a response. Please try again."
  }
  void fellBack

  // 4. Save assistant message
  const assistantMessage = await db.message.create({
    data: { chatId: id, role: 'assistant', content: assistantContent },
  })

  // 5. Auto-rename the chat if it's still the default title and this was the first message
  let updatedTitle: string | null = null
  const messageCount = allMessages.length // includes the user msg we just added
  if (chat.title === 'New chat' && messageCount === 1) {
    try {
      const titleBase = content || 'Image chat'
      updatedTitle = await generateChatTitle(titleBase)
      await db.chat.update({
        where: { id },
        data: { title: updatedTitle },
      })
    } catch {
      updatedTitle = null
    }
  }

  // Touch updatedAt so the chat bubbles to the top of the sidebar
  await db.chat.update({ where: { id }, data: {} })

  return NextResponse.json({
    userMessage,
    assistantMessage,
    title: updatedTitle,
  })
}
