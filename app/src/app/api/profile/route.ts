// Mehrzad ArianMehr©
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/profile
 * Returns the single user profile (creates a default one if it doesn't exist yet).
 */
export async function GET() {
  let profile = await db.profile.findFirst()
  if (!profile) {
    profile = await db.profile.create({
      data: { name: 'User' },
    })
  }
  return NextResponse.json({ profile })
}

/**
 * PATCH /api/profile
 * Renames the current user (and optionally sets avatar seed).
 * Body: { name?: string, avatar?: string }
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const name = typeof body.name === 'string' ? body.name.trim() : undefined
    const avatar = typeof body.avatar === 'string' ? body.avatar.trim() : undefined

    if (!name && !avatar) {
      return NextResponse.json(
        { error: 'Nothing to update. Send "name" and/or "avatar".' },
        { status: 400 }
      )
    }

    let profile = await db.profile.findFirst()
    if (!profile) {
      profile = await db.profile.create({
        data: {
          name: name ?? 'User',
          avatar: avatar ?? null,
        },
      })
    } else {
      const data: { name?: string; avatar?: string | null } = {}
      if (name) data.name = name.slice(0, 40)
      if (avatar) data.avatar = avatar
      profile = await db.profile.update({
        where: { id: profile.id },
        data,
      })
    }

    return NextResponse.json({ profile })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
