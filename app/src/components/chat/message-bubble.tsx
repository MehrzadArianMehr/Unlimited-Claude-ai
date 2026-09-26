'use client'
// Mehrzad ArianMehr©

import { Bot, User, Copy, Check, RotateCcw, Pencil, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Markdown } from './markdown'
import { cn } from '@/lib/utils'
import { messageVariants, springSnappy } from '@/lib/motion-presets'
import { useChatStore, type Attachment, type Message } from '@/lib/chat-store'

type Props = {
  message: Message
  isLast?: boolean
}

export function MessageBubble({ message, isLast }: Props) {
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const editRef = useRef<HTMLTextAreaElement>(null)

  const sending = useChatStore((s) => s.sending)
  const regenerate = useChatStore((s) => s.regenerate)
  const editUserMessage = useChatStore((s) => s.editUserMessage)

  const isUser = message.role === 'user'
  const atts = (message.attachments ?? []) as Attachment[]
  const images = atts.filter((a) => a.isImage)
  const videos = atts.filter((a) => a.isVideo)
  const files = atts.filter((a) => !a.isImage && !a.isVideo)

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  function startEdit() {
    setDraft(message.content === '(image attached)' ? '' : message.content)
    setEditing(true)
    setTimeout(() => {
      const el = editRef.current
      if (el) {
        el.focus()
        el.style.height = 'auto'
        el.style.height = Math.min(el.scrollHeight, 200) + 'px'
      }
    }, 20)
  }

  async function saveEdit() {
    const trimmed = draft.trim()
    if (!trimmed) {
      setEditing(false)
      return
    }
    setEditing(false)
    await editUserMessage(message.id, trimmed)
  }

  function cancelEdit() {
    setEditing(false)
  }

  function onEditKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void saveEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    }
  }

  // keep textarea height in sync while editing
  useEffect(() => {
    if (!editing) return
    const el = editRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [draft, editing])

  const showActions = !editing

  return (
    <motion.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      className={cn(
        'flex w-full gap-3 sm:gap-4 px-4 sm:px-6 py-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'uc-pressable flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold shadow-sm ring-1 ring-black/5 dark:ring-white/10',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
        )}
        aria-hidden
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Bubble + meta */}
      <div
        className={cn(
          'flex min-w-0 max-w-[85%] flex-col gap-1.5 sm:max-w-[75%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div className="uc-tiny flex items-center gap-2 font-medium text-muted-foreground">
          <span>{isUser ? 'You' : 'Unlimited Claude'}</span>
          <span aria-hidden>·</span>
          <span>
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Image attachments (rendered above the text bubble) */}
        {images.length > 0 && (
          <div
            className={cn(
              'mb-1.5 flex flex-wrap gap-2',
              isUser ? 'justify-end' : 'justify-start'
            )}
          >
            {images.map((img) => (
              <a
                key={img.id}
                href={img.url}
                target="_blank"
                rel="noopener noreferrer"
                className="uc-pressable group relative block overflow-hidden rounded-2xl ring-1 ring-black/5 dark:ring-white/10"
              >
                { }
                <img
                  src={img.url}
                  alt={img.name}
                  className="h-40 w-40 max-w-[220px] flex-1 object-cover transition group-hover:scale-[1.03]"
                />
                <span className="absolute bottom-1 left-1 right-1 truncate rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-sm">
                  {img.name}
                </span>
              </a>
            ))}
          </div>
        )}

        {/* Non-image file chips */}
        {files.length > 0 && (
          <div
            className={cn(
              'mb-1 flex flex-wrap gap-2',
              isUser ? 'justify-end' : 'justify-start'
            )}
          >
            {files.map((f) => (
              <a
                key={f.id}
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="uc-pressable inline-flex items-center gap-1.5 rounded-lg bg-muted/70 px-2.5 py-1.5 text-xs ring-1 ring-black/5 dark:ring-white/10"
              >
                <span className="truncate max-w-[160px] font-medium">
                  {f.name}
                </span>
                <span className="text-muted-foreground">
                  {(f.size / 1024).toFixed(0)}KB
                </span>
              </a>
            ))}
          </div>
        )}

        {/* Video attachments (rendered above the text bubble) */}
        {videos.length > 0 && (
          <div
            className={cn(
              'mb-1.5 flex flex-wrap gap-2',
              isUser ? 'justify-end' : 'justify-start'
            )}
          >
            {videos.map((v) => (
              <div
                key={v.id}
                className="uc-pressable group relative block overflow-hidden rounded-2xl ring-1 ring-black/5 dark:ring-white/10"
              >
                <video
                  src={v.url}
                  controls
                  playsInline
                  className="max-h-[320px] w-full max-w-[460px] object-contain"
                  preload="metadata"
                />
                <span className="pointer-events-none absolute bottom-1 left-1 right-1 truncate rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-sm">
                  {v.name}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Text bubble OR inline editor */}
        {editing && isUser ? (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springSnappy}
            className="w-full max-w-full"
          >
            <Textarea
              ref={editRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onEditKeyDown}
              className="uc-scroll min-h-[44px] max-h-[200px] w-full resize-none rounded-2xl rounded-tr-md bg-primary/5 p-3 text-[0.95rem] shadow-sm focus-visible:ring-2 focus-visible:ring-amber-500/40"
              rows={1}
            />
            <div className="mt-1.5 flex items-center justify-end gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                className="uc-pressable h-7 rounded-full px-2 text-xs"
                onClick={cancelEdit}
              >
                <X className="h-3.5 w-3.5" /> Cancel
              </Button>
              <Button
                size="sm"
                className="uc-pressable h-7 rounded-full px-2 text-xs"
                onClick={() => void saveEdit()}
                disabled={sending}
              >
                <Check className="h-3.5 w-3.5" /> Send
              </Button>
            </div>
          </motion.div>
        ) : (
          message.content &&
          message.content !== '(image attached)' && (
            <div
              className={cn(
                'group relative rounded-2xl px-4 py-3 text-[0.95rem] leading-relaxed shadow-sm ring-1 ring-inset ring-black/5 dark:ring-white/5',
                isUser
                  ? 'bg-primary text-primary-foreground rounded-tr-md'
                  : 'bg-muted/60 text-foreground rounded-tl-md'
              )}
            >
              {isUser ? (
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
              ) : (
                <Markdown content={message.content} />
              )}
            </div>
          )
        )}

        {/* Action row */}
        {showActions && (
          <div
            className={cn(
              'mt-0.5 flex items-center gap-1',
              isUser ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            <button
              type="button"
              onClick={copyToClipboard}
              className="uc-pressable inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-medium text-muted-foreground opacity-0 transition hover:bg-accent hover:text-foreground group-hover:opacity-100 focus:opacity-100 data-[last=true]:opacity-100"
              data-last={isLast || undefined}
              aria-label="Copy message"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Copy
                </>
              )}
            </button>

            {/* Edit (user messages only) */}
            {isUser && (
              <button
                type="button"
                onClick={startEdit}
                className="uc-pressable inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-medium text-muted-foreground opacity-0 transition hover:bg-accent hover:text-foreground group-hover:opacity-100 focus:opacity-100"
                aria-label="Edit message"
              >
                <Pencil className="h-3 w-3" /> Edit
              </button>
            )}

            {/* Regenerate (last assistant message only) */}
            {!isUser && isLast && (
              <button
                type="button"
                onClick={() => void regenerate()}
                disabled={sending}
                className="uc-pressable inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-medium text-muted-foreground opacity-0 transition hover:bg-accent hover:text-foreground group-hover:opacity-100 focus:opacity-100 data-[last=true]:opacity-100 disabled:opacity-40"
                data-last={isLast || undefined}
                aria-label="Regenerate reply"
              >
                <RotateCcw
                  className={cn('h-3 w-3', sending && 'animate-spin')}
                />{' '}
                {sending ? 'Generating…' : 'Regenerate'}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function TypingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
      className="flex w-full gap-3 sm:gap-4 px-4 sm:px-6 py-4"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10">
        <Bot className="h-4 w-4" />
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="uc-tiny flex items-center gap-2 font-medium text-muted-foreground">
          <span>Unlimited Claude</span>
          <span aria-hidden>·</span>
          <span>typing…</span>
        </div>
        <div className="inline-flex items-center gap-1 rounded-2xl rounded-tl-md bg-muted/60 px-4 py-3.5 shadow-sm ring-1 ring-inset ring-black/5 dark:ring-white/5">
          <span className="uc-typing-dot h-2 w-2 rounded-full bg-foreground/60" style={{ animationDelay: '0s' }} />
          <span className="uc-typing-dot h-2 w-2 rounded-full bg-foreground/60" style={{ animationDelay: '0.15s' }} />
          <span className="uc-typing-dot h-2 w-2 rounded-full bg-foreground/60" style={{ animationDelay: '0.3s' }} />
        </div>
      </div>
    </motion.div>
  )
}
