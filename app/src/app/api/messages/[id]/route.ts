// Mehrzad ArianMehr©
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getChatReply, type ChatMessage, type AttachmentRef } from '@/lib/llm'

type RouteParams = { params: Promise<{ id: string }> }

/**
 * PATCH /api/messages/[id]
 * Body: { content: string }
 *
 * Edits an existing USER message, then regenerates the assistant reply:
 * 1. Validates the target message exists and is a user message.
 * 2. Updates its content.
 * 3. Deletes every message in the same chat created AFTER it
 *    (i.e. the old assistant reply + any later turns — classic "edit & resend").
 * 4. Re-calls the LLM on the trimmed history (preserving any image attachments
 *    on the edited user message for the vision path).
 * 5. Saves and returns the new assistant message.
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params

  let content = ''
  try {
    const body = await req.json()
    if (typeof body?.content === 'string') content = body.content.trim()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!content) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }

  const target = await db.message.findUnique({ where: { id } })
  if (!target) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 })
  }
  if (target.role !== 'user') {
    return NextResponse.json(
      { error: 'Only user messages can be edited.' },
      { status: 400 }
    )
  }

  // Update the edited message content
  await db.message.update({
    where: { id },
    data: { content },
  })

  // Delete every message in this chat created after the edited one
  await db.message.deleteMany({
    where: {
      chatId: target.chatId,
      createdAt: { gt: target.createdAt },
    },
  })

  // Load the trimmed history (up to and including the edited message)
  const historyRows = await db.message.findMany({
    where: { chatId: target.chatId },
    orderBy: { createdAt: 'asc' },
    select: { role: true, content: true, attachments: true },
  })

  const history: ChatMessage[] = historyRows.map((m) => ({
    role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
    content: m.content,
  }))

  // The edited message is the last one; reuse its attachments for the vision path
  let lastUserAttachments: AttachmentRef[] = []
  const lastRow = historyRows[historyRows.length - 1]
  if (lastRow?.attachments) {
    try {
      const parsed = JSON.parse(lastRow.attachments)
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
    data: { chatId: target.chatId, role: 'assistant', content: assistantContent },
  })

  // Touch the chat's updatedAt so it floats to the top of the sidebar
  await db.chat.update({ where: { id: target.chatId }, data: {} })

  // Return the full trimmed message list so the client can sync exactly.
  const fresh = await db.message.findMany({
    where: { chatId: target.chatId },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({
    userMessageId: id,
    assistantMessage,
    messages: fresh,
  })
}
