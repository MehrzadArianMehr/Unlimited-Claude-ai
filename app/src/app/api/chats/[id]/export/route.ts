// Mehrzad ArianMehr©
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

type RouteParams = { params: Promise<{ id: string }> }

function safeTitle(title: string): string {
  return (title || 'chat')
    .replace(/[^\w\u0600-\u06FF\s-]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 60) || 'chat'
}

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

/**
 * GET /api/chats/[id]/export
 *
 * Exports a single chat (title + messages) as a Markdown document.
 * Use `?format=text` for plain text instead of markdown.
 *
 * Returns a downloadable file attachment (`Content-Disposition`).
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format') === 'text' ? 'text' : 'md'

  const chat = await db.chat.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })

  if (!chat) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
  }

  const lines: string[] = []

  if (format === 'md') {
    lines.push(`# ${chat.title}`)
    lines.push('')
    lines.push(`_Exported from Unlimited Claude · ${fmtTime(new Date().toISOString())}_`)
    lines.push('')
    lines.push('---')
    lines.push('')
  } else {
    lines.push(`Chat: ${chat.title}`)
    lines.push(`Exported: ${fmtTime(new Date().toISOString())}`)
    lines.push('')
  }

  for (const m of chat.messages) {
    const who = m.role === 'user' ? 'You' : 'Unlimited Claude'
    const ts = fmtTime(m.createdAt)

    // parse attachments if any
    let atts: Array<{ url: string; name: string; isImage?: boolean }> = []
    if (m.attachments) {
      try {
        const parsed = JSON.parse(m.attachments)
        if (Array.isArray(parsed)) atts = parsed
      } catch {
        /* ignore */
      }
    }

    if (format === 'md') {
      lines.push(`## ${who}`)
      lines.push(`_${ts}_`)
      lines.push('')
      lines.push(m.content)
      lines.push('')
      if (atts.length > 0) {
        lines.push('**Attachments:**')
        for (const a of atts) {
          if (a.isImage) {
            lines.push(`![${a.name}](${a.url})`)
          } else {
            lines.push(`- [${a.name}](${a.url})`)
          }
        }
        lines.push('')
      }
      lines.push('---')
      lines.push('')
    } else {
      lines.push(`[${ts}] ${who}:`)
      lines.push(m.content)
      if (atts.length > 0) {
        lines.push(
          `Attachments: ${atts.map((a) => a.name).join(', ')}`
        )
      }
      lines.push('')
    }
  }

  const body = lines.join('\n')
  const filename = `${safeTitle(chat.title)}.${format}`
  const mime = format === 'md' ? 'text/markdown; charset=utf-8' : 'text/plain; charset=utf-8'

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': mime,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
