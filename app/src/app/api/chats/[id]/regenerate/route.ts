// Mehrzad ArianMehr©
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getChatReply, type ChatMessage, type AttachmentRef } from '@/lib/llm'

type RouteParams = { params: Promise<{ id: string }> }

/**
 * POST /api/chats/[id]/regenerate
 *
 * Re-runs the assistant's reply for the most recent user turn:
 * 1. If the last message is an assistant message, deletes it.
 * 2. Finds the last user message and uses everything up to it as history.
 * 3. Re-calls the LLM (vision path if that user message had image attachments).
 * 4. Saves and returns the new assistant message.
 *
 * Returns 400 if there's no user message to regenerate from.
 */
export async function POST(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const chat = await db.chat.findUnique({ where: { id } })
  if (!chat) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
  }

  const all = await db.message.findMany({
    where: { chatId: id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, role: true, content: true, attachments: true },
  })

  if (all.length === 0) {
    return NextResponse.json(
      { error: 'Nothing to regenerate — this chat is empty.' },
      { status: 400 }
    )
  }

  // If the last message is an assistant reply, drop it before regenerating.
  let lastUserIdx = -1
  if (all[all.length - 1].role === 'assistant') {
    await db.message.delete({ where: { id: all[all.length - 1].id } })
    // find the last user message index
    for (let i = all.length - 2; i >= 0; i--) {
      if (all[i].role === 'user') {
        lastUserIdx = i
        break
      }
    }
  } else {
    // last message is a user message (AI never replied) -> generate from it
    lastUserIdx = all.length - 1
  }

  if (lastUserIdx < 0) {
    return NextResponse.json(
      { error: 'No user message to regenerate from.' },
      { status: 400 }
    )
  }

  const lastUserMessage = all[lastUserIdx]
  const historyMessages = all.slice(0, lastUserIdx + 1)
  const history: ChatMessage[] = historyMessages.map((m) => ({
    role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
    content: m.content,
  }))

  // Parse attachments on the last user message for the vision path
  let lastUserAttachments: AttachmentRef[] = []
  if (lastUserMessage.attachments) {
    try {
      const parsed = JSON.parse(lastUserMessage.attachments)
      if (Array.isArray(parsed)) lastUserAttachments = parsed as AttachmentRef[]
    } catch {
      /* ignore */
    }
  }

  let assistantContent: string
  try {
    assistantContent = await getChatReply(history, {
      lastUserAttachments,
    })
  } catch (e) {
    return NextResponse.json(
      {
        error: 'Failed to get AI reply',
        detail: e instanceof Error ? e.message : 'Unknown error',
      },
      { status: 502 }
    )
  }

  if (!assistantContent) {
    assistantContent = "I'm sorry, I couldn't generate a response. Please try again."
  }

  const assistantMessage = await db.message.create({
    data: { chatId: id, role: 'assistant', content: assistantContent },
  })

  // Touch updatedAt so the chat stays at the top of the sidebar
  await db.chat.update({ where: { id }, data: {} })

  return NextResponse.json({ assistantMessage })
}
