'use client'
// Mehrzad ArianMehr©

import {
  Plus,
  MessageSquare,
  MoreHorizontal,
  Pin,
  PinOff,
  Pencil,
  Trash2,
  Sun,
  Moon,
  Check,
  Search,
  X,
  Sparkles,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useTheme } from 'next-themes'
import { useChatStore, type ChatSummary } from '@/lib/chat-store'
import { chatItemVariants, springDefault, springSnappy } from '@/lib/motion-presets'
import { groupChatsBySections } from '@/lib/chat-sections'
import { PuterAccountCard } from './puter-account-card'
import { SkillsPanel } from './skills-panel'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function Sidebar({
  onCloseMobile,
  searchRef,
}: {
  onCloseMobile?: () => void
  searchRef?: React.RefObject<HTMLInputElement | null>
}) {
  const {
    chats,
    activeChatId,
    profile,
    loadingChats,
    fetchProfile,
    fetchChats,
    createChat,
    selectChat,
    renameChat,
    togglePin,
    deleteChat,
    renameUser,
  } = useChatStore()

  const { resolvedTheme, setTheme } = useTheme()

  // ---- search ----
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)

  // initial load
  useEffect(() => {
    void fetchProfile()
    void fetchChats()
  }, [fetchProfile, fetchChats])

  // debounced search
  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setSearching(false)
      void fetchChats()
      return
    }
    setSearching(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/chats?archived=0&q=${encodeURIComponent(q)}`, {
          cache: 'no-store',
        })
        if (!res.ok) return
        const data = await res.json()
        useChatStore.setState({ chats: data.chats ?? [] })
      } catch {
        /* ignore */
      } finally {
        setSearching(false)
      }
    }, 220)
    return () => clearTimeout(t)
     
  }, [query])

  // ---- rename chat state ----
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  // ---- delete chat state ----
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ---- rename user state ----
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

  // ---- skills panel state ----
  const [skillsOpen, setSkillsOpen] = useState(false)

  async function handleNewChat() {
    const id = await createChat()
    if (!id) {
      toast.error('Could not start a new chat')
      return
    }
    setQuery('')
    toast.success('New chat started')
    onCloseMobile?.()
  }

  async function handleSelectChat(id: string) {
    await selectChat(id)
    onCloseMobile?.()
  }

  function startRenameChat(c: ChatSummary) {
    setRenamingId(c.id)
    setRenameValue(c.title)
  }

  async function confirmRenameChat() {
    if (!renamingId) return
    const ok = await renameChat(renamingId, renameValue)
    if (ok) toast.success('Chat renamed')
    else toast.error('Failed to rename chat')
    setRenamingId(null)
  }

  async function confirmDeleteChat() {
    if (!deletingId) return
    await deleteChat(deletingId)
    toast.success('Chat deleted')
    setDeletingId(null)
  }

  function startEditName() {
    setNameDraft(profile?.name ?? 'User')
    setEditingName(true)
    setTimeout(() => nameInputRef.current?.focus(), 30)
  }

  async function saveName() {
    const trimmed = nameDraft.trim()
    if (!trimmed) {
      setEditingName(false)
      return
    }
    const ok = await renameUser(trimmed)
    if (ok) toast.success('Profile name updated')
    else toast.error('Failed to update name')
    setEditingName(false)
  }

  function onNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      void saveName()
    } else if (e.key === 'Escape') {
      setEditingName(false)
    }
  }

  const initials = (profile?.name ?? 'U')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const activeChat = chats.find((c) => c.id === activeChatId)

  // Render a single chat row (used both in sectioned view and search view)
  function renderRow(c: ChatSummary) {
    const isActive = c.id === activeChatId
    const isRenaming = renamingId === c.id
    return (
      <motion.li
        key={c.id}
        layout
        variants={chatItemVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {isRenaming ? (
          <div className="flex items-center gap-1 rounded-xl bg-accent px-1.5 py-1">
            <Input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void confirmRenameChat()
                } else if (e.key === 'Escape') {
                  setRenamingId(null)
                }
              }}
              className="h-8 flex-1 bg-background text-sm"
            />
            <Button
              size="icon"
              variant="ghost"
              className="uc-pressable h-7 w-7"
              onClick={() => void confirmRenameChat()}
              aria-label="Save rename"
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            className={cn(
              'uc-pressable group relative flex items-center gap-2 rounded-xl px-2.5 py-2 text-[13px] transition',
              isActive
                ? 'bg-accent font-medium text-accent-foreground'
                : 'text-foreground/85 hover:bg-accent/50'
            )}
            onClick={() => void handleSelectChat(c.id)}
          >
            {isActive && (
              <motion.span
                layoutId="active-chat-bar"
                className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-amber-500 to-orange-600"
                transition={springDefault}
              />
            )}
            {c.pinned && (
              <Pin className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />
            )}
            <span className="min-w-0 flex-1 truncate">{c.title}</span>
            {(c._count?.messages ?? 0) > 0 && (
              <span className="uc-tiny shrink-0 rounded-full bg-muted px-1.5 text-muted-foreground">
                {c._count!.messages}
              </span>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="uc-pressable ml-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition hover:bg-background hover:text-foreground group-hover:opacity-100 focus:opacity-100"
                  aria-label="Chat options"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuItem
                  onClick={() => void togglePin(c.id, !c.pinned)}
                >
                  {c.pinned ? (
                    <>
                      <PinOff className="h-4 w-4" /> Unpin
                    </>
                  ) : (
                    <>
                      <Pin className="h-4 w-4" /> Pin to top
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => startRenameChat(c)}>
                  <Pencil className="h-4 w-4" /> Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeletingId(c.id)}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </motion.li>
    )
  }

  return (
    <aside className="uc-material relative flex h-full w-full flex-col">
      {/* Top bar: brand + theme toggle */}
      <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm ring-1 ring-black/10 dark:ring-white/10">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold tracking-tight">
              Unlimited Claude
            </div>
            <div className="uc-tiny text-muted-foreground">AI Chat</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="uc-pressable relative h-8 w-8 rounded-full"
            onClick={() => setSkillsOpen(true)}
            aria-label="Open Skills panel"
            title="Skills"
          >
            <Sparkles className="h-4 w-4" />
            <span className="absolute right-1 top-1 inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-sidebar" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="uc-pressable h-8 w-8 rounded-full"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            suppressHydrationWarning
          >
            <Sun className="hidden h-4 w-4 dark:inline" />
            <Moon className="h-4 w-4 dark:hidden" />
          </Button>
        </div>
      </div>

      {/* New chat button (THE key feature the user asked to fix) */}
      <div className="px-3 pb-2">
        <Button
          onClick={handleNewChat}
          className="uc-pressable uc-sheen w-full justify-start gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 px-3.5 text-white shadow-sm hover:from-amber-600 hover:to-orange-700"
        >
          <Plus className="h-4 w-4" />
          <span className="font-medium">New chat</span>
          <kbd className="ml-auto hidden rounded-md bg-white/30 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm ring-1 ring-inset ring-white/40 sm:inline">
            ⌘K
          </kbd>
        </Button>
      </div>

      {/* Search box (Apple-style: minimal, translucent) */}
      <div className="px-3 pb-2">
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            className="h-9 rounded-xl border-border/60 bg-muted/50 pl-8 pr-7 text-[13px] shadow-none focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-amber-500/30"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Chat list */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between px-4 pb-1 pt-1">
          <div className="uc-tiny font-medium uppercase tracking-wide text-muted-foreground">
            {query ? 'Results' : 'Chats'}
          </div>
          {searching && (
            <div className="uc-tiny text-muted-foreground">searching…</div>
          )}
        </div>
        <div className="uc-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {loadingChats && chats.length === 0 ? (
            <div className="space-y-2 px-2 py-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-10 animate-pulse rounded-xl bg-muted/60"
                />
              ))}
            </div>
          ) : chats.length === 0 ? (
            <div className="px-3 py-10 text-center text-sm text-muted-foreground">
              <MessageSquare className="mx-auto mb-2 h-6 w-6 opacity-40" />
              {query ? (
                <>No chats match “{query}”.</>
              ) : (
                <>
                  No chats yet. <br /> Click{' '}
                  <span className="font-medium text-foreground">New chat</span>{' '}
                  to begin.
                </>
              )}
            </div>
          ) : query ? (
            /* Search mode: flat list, no sections */
            <motion.ul layout className="space-y-0.5">
              <AnimatePresence initial={false}>
                {chats.map((c) => renderRow(c))}
              </AnimatePresence>
            </motion.ul>
          ) : (
            /* Default: date-based sections (Pinned / Today / Yesterday / …) */
            <motion.ul layout className="space-y-0.5">
              <AnimatePresence initial={false}>
                {groupChatsBySections(chats).flatMap((section) => [
                  <motion.li
                    key={`section-${section.key}`}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={springSnappy}
                    className="uc-tiny select-none px-2.5 pb-0.5 pt-3 font-semibold uppercase tracking-wide text-muted-foreground/70"
                  >
                    {section.label}
                  </motion.li>,
                  ...section.items.map((c) => renderRow(c)),
                ])}
              </AnimatePresence>
            </motion.ul>
          )}
        </div>
      </div>

      {/* Account section at the bottom — Puter login/auth.
          When not signed into Puter, the local rename card is shown below
          the login button as a fallback. When signed in, only the Puter
          account card is shown (username synced from Puter). */}
      <div className="border-t border-border/40 p-3">
        <PuterAccountCard>
          {/* local-name fallback (shown only when not signed into Puter) */}
          <div className="uc-pressable flex items-center gap-3 rounded-2xl bg-accent/30 p-2.5 ring-1 ring-inset ring-black/5 dark:ring-white/5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-[11px] font-semibold text-white shadow-sm">
              {initials || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              {editingName ? (
                <Input
                  ref={nameInputRef}
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={onNameKeyDown}
                  onBlur={() => void saveName()}
                  maxLength={40}
                  className="h-8 bg-background text-[13px]"
                  placeholder="Your name"
                />
              ) : (
                <button
                  type="button"
                  onClick={startEditName}
                  className="group flex w-full items-center gap-1.5 text-left"
                  title="Click to rename"
                >
                  <span className="truncate text-[13px] font-medium">
                    {profile?.name ?? 'User'}
                  </span>
                  <Pencil className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                </button>
              )}
              <div className="uc-tiny text-muted-foreground">
                Local name · Click to rename
              </div>
            </div>
          </div>
        </PuterAccountCard>
      </div>

      {/* Active chat summary (sr-only, for screen readers) */}
      {activeChat && (
        <div className="sr-only" aria-live="polite">
          Active chat: {activeChat.title}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the chat and all its messages. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void confirmDeleteChat()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Skills panel (slide-in sheet) */}
      <SkillsPanel open={skillsOpen} onOpenChange={setSkillsOpen} />
    </aside>
  )
}
