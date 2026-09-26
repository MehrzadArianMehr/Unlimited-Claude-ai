// Mehrzad ArianMehr©
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/chats
 * List all chats ordered by most recently updated.
 * Supports:
 *   ?archived=0|1   filter by archived flag
 *   ?q=keyword      case-insensitive search on chat title (and any message content)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const archivedParam = searchParams.get('archived')
  const q = searchParams.get('q')?.trim() ?? ''

  const where: {
    archived?: boolean
    OR?: Array<Record<string, unknown>>
  } = {}
  if (archivedParam === '1') where.archived = true
  else if (archivedParam === '0') where.archived = false

  if (q) {
    where.OR = [
      { title: { contains: q } },
      {
        messages: {
          some: { content: { contains: q } },
        },
      },
    ]
  }

  const chats = await db.chat.findMany({
    where,
    orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
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

  return NextResponse.json({ chats })
}

/**
 * POST /api/chats
 * Create a brand new, empty chat ("New chat").
 * Body (optional): { title?: string }
 */
export async function POST(req: NextRequest) {
  try {
    let title = 'New chat'
    try {
      const body = await req.json()
      if (typeof body?.title === 'string' && body.title.trim()) {
        title = body.title.trim().slice(0, 80)
      }
    } catch {
      // No body or invalid JSON -> default title
    }

    const chat = await db.chat.create({
      data: { title },
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

    return NextResponse.json({ chat }, { status: 201 })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
