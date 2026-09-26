// Mehrzad ArianMehr©
import type { ChatSummary } from '@/lib/chat-store'

export type ChatSection = {
  key: string
  label: string
  items: ChatSummary[]
}

/**
 * Group an already-sorted list of chats into date-based sections for the
 * sidebar (Claude.ai / ChatGPT style):
 *   Pinned  -> all pinned chats (regardless of date), in their existing order
 *   Today / Yesterday / Previous 7 days / Previous 30 days / Older
 *
 * Chats arrive already sorted by the API (pinned desc, then updatedAt desc).
 * We preserve that order within each section and drop empty sections.
 */
export function groupChatsBySections(chats: ChatSummary[]): ChatSection[] {
  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)

  const buckets: Record<
    string,
    { label: string; items: ChatSummary[] }
  > = {
    pinned: { label: 'Pinned', items: [] },
    today: { label: 'Today', items: [] },
    yesterday: { label: 'Yesterday', items: [] },
    week: { label: 'Previous 7 days', items: [] },
    month: { label: 'Previous 30 days', items: [] },
    older: { label: 'Older', items: [] },
  }

  for (const c of chats) {
    if (c.pinned) {
      buckets.pinned.items.push(c)
      continue
    }
    const updated = new Date(c.updatedAt)
    if (Number.isNaN(updated.getTime())) {
      buckets.older.items.push(c)
      continue
    }
    const startOfYesterday = new Date(startOfToday)
    startOfYesterday.setDate(startOfYesterday.getDate() - 1)
    const ms7 = 7 * 24 * 60 * 60 * 1000
    const ms30 = 30 * 24 * 60 * 60 * 1000

    if (updated >= startOfToday) {
      buckets.today.items.push(c)
    } else if (updated >= startOfYesterday) {
      buckets.yesterday.items.push(c)
    } else if (updated.getTime() >= startOfToday.getTime() - ms7) {
      buckets.week.items.push(c)
    } else if (updated.getTime() >= startOfToday.getTime() - ms30) {
      buckets.month.items.push(c)
    } else {
      buckets.older.items.push(c)
    }
  }

  const order = ['pinned', 'today', 'yesterday', 'week', 'month', 'older']
  return order
    .map((key) => ({ key, ...buckets[key] }))
    .filter((s) => s.items.length > 0)
}
