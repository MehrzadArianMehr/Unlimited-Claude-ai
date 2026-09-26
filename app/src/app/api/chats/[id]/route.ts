// Mehrzad ArianMehr©
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

type RouteParams = { params: Promise<{ id: string }> }

/**
 * GET /api/chats/[id]
 * Fetch one chat with all its messages, ordered chronologically.
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const chat = await db.chat.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!chat) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
  }
  return NextResponse.json({ chat })
}

/**
 * PATCH /api/chats/[id]
 * Update title / pinned / archived.
 * Body: { title?: string, pinned?: boolean, archived?: boolean }
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    const body = await req.json()
    const data: {
      title?: string
      pinned?: boolean
      archived?: boolean
    } = {}

    if (typeof body.title === 'string' && body.title.trim()) {
      data.title = body.title.trim().slice(0, 80)
    }
    if (typeof body.pinned === 'boolean') data.pinned = body.pinned
    if (typeof body.archived === 'boolean') data.archived = body.archived

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const chat = await db.chat.update({
      where: { id },
      data,
      select: {
        id: true,
        title: true,
        pinned: true,
        archived: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    })
    return NextResponse.json({ chat })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/chats/[id]
 * Permanently delete a chat and (cascade) its messages.
 */
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    await db.chat.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
