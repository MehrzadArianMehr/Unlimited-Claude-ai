'use client'
// Mehrzad ArianMehr©

import { Sparkles, Plus, ArrowDown, Download } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore, type Message } from '@/lib/chat-store'
import { MessageBubble, TypingBubble } from './message-bubble'
import { ChatInput } from './chat-input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { springSnappy } from '@/lib/motion-presets'
import { toast } from 'sonner'

/** Download a chat as a Markdown file via the export endpoint. */
async function exportChat(id: string, title: string) {
  try {
    const res = await fetch(`/api/chats/${id}/export?format=md`, {
      cache: 'no-store',
    })
    if (!res.ok) {
      toast.error('Could not export chat')
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = (title || 'chat').replace(/[^\w\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '_').slice(0, 60) + '.md'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.success('Chat exported as Markdown')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Export failed')
  }
}

export function ChatArea({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const {
    activeChatId,
    chats,
    messages,
    loadingMessages,
    sending,
    createChat,
  } = useChatStore()

  const activeChat = chats.find((c) => c.id === activeChatId)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [atBottom, setAtBottom] = useState(true)

  // Track whether the user is near the bottom of the message list
  function onScroll() {
    const el = scrollRef.current
    if (!el) return
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight
    setAtBottom(dist < 80)
    setShowScrollTop(el.scrollTop > 240)
  }

  // Auto-scroll to bottom when messages change, but only if user is at/near bottom
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (atBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, sending, activeChatId, atBottom])

  // Jump to bottom on chat switch (always) — recompute atBottom from the DOM.
  const prevChatRef = useRef<string | null>(activeChatId)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (prevChatRef.current !== activeChatId) {
      prevChatRef.current = activeChatId
      el.scrollTop = el.scrollHeight // instant jump
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight
      setAtBottom(dist < 80)
    }
  }, [activeChatId])

  function scrollToBottom() {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    setAtBottom(true)
  }

  const isEmpty = !activeChatId || (!loadingMessages && messages.length === 0)

  // Group messages by date for separators
  const grouped = useMemo(() => groupByDay(messages), [messages])

  return (
    <main className="relative flex min-h-0 flex-1 flex-col bg-background">
      {/* Floating translucent header */}
      <header className="uc-material sticky top-0 z-20 flex items-center gap-2 px-3 py-2.5 sm:px-6">
        {/* mobile: open sidebar */}
        <Button
          variant="ghost"
          size="sm"
          className="uc-pressable lg:hidden"
          onClick={onOpenSidebar}
        >
          Chats
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[13px] font-semibold tracking-tight">
            {activeChat?.title ?? 'Unlimited Claude'}
          </h1>
        </div>

        {/* Export chat (only when there's an active chat with messages) */}
        {activeChatId && messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="uc-pressable hidden h-8 gap-1.5 rounded-full text-[12px] text-muted-foreground hover:bg-accent hover:text-foreground sm:inline-flex"
            onClick={() => void exportChat(activeChatId, activeChat?.title ?? 'chat')}
            aria-label="Export chat as Markdown"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        )}

        <span className="inline-flex items-center gap-1 rounded-full uc-iridescent-soft px-2.5 py-0.5 text-[11px] font-medium text-violet-300 ring-1 ring-inset ring-violet-500/30">
          <Sparkles className="h-3 w-3" />
          AI
        </span>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="uc-scroll relative min-h-0 flex-1 overflow-y-auto"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeChatId ?? 'empty'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={springSnappy}
          >
        {isEmpty ? (
          <EmptyState
            onStart={() => void createChat()}
            hasChat={!!activeChatId}
          />
        ) : loadingMessages ? (
          <div className="space-y-4 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                <div className="h-20 w-2/3 animate-pulse rounded-2xl bg-muted" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mx-auto w-full max-w-3xl py-4">
            <AnimatePresence initial={false}>
              {grouped.map((group) => (
                <div key={group.key}>
                  <DateSeparator label={group.label} />
                  <AnimatePresence initial={false}>
                    {group.items.map((m, i) => (
                      <MessageBubble
                        key={m.id}
                        message={m}
                        isLast={
                          i === group.items.length - 1 &&
                          group.key === grouped[grouped.length - 1].key
                        }
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ))}
            </AnimatePresence>
            {sending && <TypingBubble />}
            <div className="h-4" />
          </div>
        )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Scroll-to-bottom floating button (Apple-style, material) */}
      <AnimatePresence>
        {!atBottom && !isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.85 }}
            transition={springSnappy}
            className="absolute bottom-28 left-1/2 z-30 -translate-x-1/2"
          >
            <button
              type="button"
              onClick={scrollToBottom}
              className="uc-pressable uc-material-strong inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground shadow-lg ring-1 ring-black/10 dark:ring-white/10"
              aria-label="Scroll to latest"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <ChatInput chatId={activeChatId} />
    </main>
  )
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="sticky top-2 z-10 mx-auto my-2 w-fit">
      <span className="uc-tiny inline-block rounded-full bg-muted/80 px-2.5 py-0.5 font-medium text-muted-foreground backdrop-blur-sm">
        {label}
      </span>
    </div>
  )
}

function EmptyState({
  onStart,
  hasChat,
}: {
  onStart: () => void
  hasChat: boolean
}) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-12 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={springSnappy}
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] uc-iridescent text-white shadow-[0_8px_24px_-8px_rgba(139,92,246,0.6)] ring-1 ring-black/10 dark:ring-white/10"
      >
        <Sparkles className="h-7 w-7" />
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, ...springSnappy }}
        className="text-[28px] font-semibold tracking-tight"
      >
        How can I help you today?
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ...springSnappy }}
        className="mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground"
      >
        Ask anything — get clear answers, draft text, brainstorm ideas, write
        code, or attach an image to analyze.
      </motion.p>

      <div className="mt-6 grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
        {[
          {
            t: 'Explain a concept',
            d: 'Explain how neural networks learn, simply.',
          },
          {
            t: 'Draft an email',
            d: 'Write a polite follow-up email to a client.',
          },
          {
            t: 'Write code',
            d: 'A Python function to read a CSV file.',
          },
          {
            t: 'Analyze an image',
            d: 'Attach a screenshot and ask about it.',
          },
        ].map((s, i) => (
          <motion.button
            key={s.t}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + i * 0.05, ...springSnappy }}
            whileHover={{ y: -2, scale: 1.01, transition: springSnappy }}
            whileTap={{ scale: 0.98 }}
            onClick={onStart}
            className="uc-pressable group rounded-2xl border border-border/70 bg-card/60 p-3.5 text-left backdrop-blur-sm transition hover:border-violet-500/40 hover:bg-accent/50 hover:shadow-sm"
          >
            <div className="text-[13px] font-semibold tracking-tight">
              {s.t}
            </div>
            <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {s.d}
            </div>
          </motion.button>
        ))}
      </div>

      {!hasChat && (
        <Button
          onClick={onStart}
          className="uc-pressable uc-sheen mt-6 gap-2 rounded-2xl uc-iridescent px-4 text-white "
        >
          <Plus className="h-4 w-4" />
          Start a new chat
        </Button>
      )}
    </div>
  )
}

/* ---------- helpers ---------- */

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x.getTime()
}

function dayLabel(date: Date): string {
  const today = startOfDay(new Date())
  const day = startOfDay(date)
  const diffDays = Math.round((today - day) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'long' })
  }
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: diffDays > 365 ? 'numeric' : undefined,
  })
}

function groupByDay(messages: Message[]) {
  const groups: { key: string; label: string; items: Message[] }[] = []
  for (const m of messages) {
    const d = new Date(m.createdAt)
    const key = String(startOfDay(d))
    const last = groups[groups.length - 1]
    if (last && last.key === key) {
      last.items.push(m)
    } else {
      groups.push({ key, label: dayLabel(d), items: [m] })
    }
  }
  return groups
}
