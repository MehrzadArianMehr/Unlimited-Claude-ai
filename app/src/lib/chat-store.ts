'use client'
// Mehrzad ArianMehr©

import { create } from 'zustand'

export type ChatSummary = {
  id: string
  title: string
  pinned: boolean
  archived: boolean
  createdAt: string
  updatedAt: string
  _count?: { messages: number }
}

export type Attachment = {
  id: string
  url: string
  name: string
  type: string
  size: number
  isImage?: boolean
  isVideo?: boolean
}

export type Message = {
  id: string
  chatId: string
  role: 'user' | 'assistant'
  content: string
  attachments?: Attachment[] | null
  createdAt: string
}

function parseAttachments(raw?: string | null): Attachment[] | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Attachment[]) : null
  } catch {
    return null
  }
}

export type Profile = {
  id: string
  name: string
  avatar: string | null
  createdAt: string
  updatedAt: string
}

export type AiModel = {
  id: string
  label: string
  vendor: 'claude' | 'gpt' | 'o1' | 'gemini' | 'llama'
}

export const AI_MODELS: AiModel[] = [
  { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', vendor: 'claude' },
  { id: 'claude-3-7-sonnet', label: 'Claude 3.7 Sonnet', vendor: 'claude' },
  { id: 'claude-3-5-haiku', label: 'Claude 3.5 Haiku', vendor: 'claude' },
  { id: 'gpt-4o', label: 'GPT-4o', vendor: 'gpt' },
  { id: 'gpt-4o-mini', label: 'GPT-4o mini', vendor: 'gpt' },
  { id: 'o1-mini', label: 'o1-mini', vendor: 'o1' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', vendor: 'gemini' },
  { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B', vendor: 'llama' },
]

type ChatState = {
  // data
  profile: Profile | null
  chats: ChatSummary[]
  activeChatId: string | null
  messages: Message[]
  aiModel: string
  setAiModel: (id: string) => void
  // loading flags
  loadingChats: boolean
  loadingMessages: boolean
  sending: boolean
  // actions
  fetchProfile: () => Promise<void>
  renameUser: (name: string) => Promise<boolean>
  fetchChats: () => Promise<void>
  createChat: () => Promise<string | null>
  selectChat: (id: string) => Promise<void>
  renameChat: (id: string, title: string) => Promise<boolean>
  togglePin: (id: string, pinned: boolean) => Promise<void>
  archiveChat: (id: string, archived: boolean) => Promise<void>
  deleteChat: (id: string) => Promise<void>
  sendMessage: (content: string, attachments?: Attachment[]) => Promise<void>
  regenerate: () => Promise<boolean>
  editUserMessage: (id: string, content: string) => Promise<boolean>
  invokeSkill: (skill: 'image' | 'video', prompt: string) => Promise<boolean>
}

export const useChatStore = create<ChatState>((set, get) => ({
  profile: null,
  chats: [],
  activeChatId: null,
  messages: [],
  aiModel: (typeof window !== 'undefined' && window.localStorage.getItem('uc.aiModel')) || 'claude-3-5-sonnet',
  setAiModel(aiModel) {
    set({ aiModel })
    try {
      window.localStorage.setItem('uc.aiModel', aiModel)
    } catch {
      /* ignore */
    }
  },
  loadingChats: false,
  loadingMessages: false,
  sending: false,

  async fetchProfile() {
    try {
      const res = await fetch('/api/profile', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      set({ profile: data.profile ?? null })
    } catch {
      /* ignore */
    }
  },

  async renameUser(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return false
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      if (!res.ok) return false
      const data = await res.json()
      set({ profile: data.profile })
      return true
    } catch {
      return false
    }
  },

  async fetchChats() {
    set({ loadingChats: true })
    try {
      const res = await fetch('/api/chats?archived=0', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      set({ chats: data.chats ?? [] })
    } finally {
      set({ loadingChats: false })
    }
  },

  async createChat() {
    // Auto-cleanup: if the currently-active chat is empty (0 messages),
    // delete it before creating a new one so empty "New chat" ghosts don't
    // pile up in the sidebar. Use the live `messages` array for the active
    // chat's count — it's always fresh, unlike `_count` on the chat summary.
    const prev = get().activeChatId
    if (prev) {
      const prevMessages = get().messages.length
      const prevChat = get().chats.find((c) => c.id === prev)
      const prevCount = prevChat?._count?.messages ?? prevMessages
      const isEmpty = prevMessages === 0 && prevCount === 0
      if (isEmpty) {
        fetch(`/api/chats/${prev}`, { method: 'DELETE' }).catch(() => {})
        set((s) => ({ chats: s.chats.filter((c) => c.id !== prev) }))
      }
    }

    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) return null
      const data = await res.json()
      const chat = data.chat as ChatSummary
      set((s) => ({ chats: [chat, ...s.chats.filter((c) => c.id !== chat.id)], activeChatId: chat.id, messages: [] }))
      return chat.id
    } catch {
      return null
    }
  },

  async selectChat(id: string) {
    // Auto-cleanup: if the currently-active chat is empty (0 messages),
    // delete it before switching away so the sidebar doesn't fill with
    // "New chat" ghosts. Never delete the one we're switching TO.
    const prev = get().activeChatId
    if (prev && prev !== id) {
      const prevMessages = get().messages.length
      const prevChat = get().chats.find((c) => c.id === prev)
      const prevCount = prevChat?._count?.messages ?? prevMessages
      const isEmpty = prevMessages === 0 && prevCount === 0
      if (isEmpty) {
        fetch(`/api/chats/${prev}`, { method: 'DELETE' }).catch(() => {})
        set((s) => ({ chats: s.chats.filter((c) => c.id !== prev) }))
      }
    }

    set({ activeChatId: id, loadingMessages: true, messages: [] })
    try {
      const res = await fetch(`/api/chats/${id}`, { cache: 'no-store' })
      if (!res.ok) {
        set({ loadingMessages: false })
        return
      }
      const data = await res.json()
      set({
        messages: (data.chat?.messages ?? []).map(
          (m: Message & { attachments?: string | null }) => ({
            ...m,
            attachments: parseAttachments(m.attachments),
          })
        ),
      })
    } finally {
      set({ loadingMessages: false })
    }
  },

  async renameChat(id: string, title: string) {
    const trimmed = title.trim()
    if (!trimmed) return false
    try {
      const res = await fetch(`/api/chats/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      })
      if (!res.ok) return false
      const data = await res.json()
      const updated = data.chat as ChatSummary
      set((s) => ({
        chats: s.chats.map((c) => (c.id === id ? { ...c, ...updated } : c)),
      }))
      return true
    } catch {
      return false
    }
  },

  async togglePin(id: string, pinned: boolean) {
    // optimistic
    set((s) => ({
      chats: s.chats.map((c) => (c.id === id ? { ...c, pinned } : c)),
    }))
    try {
      await fetch(`/api/chats/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned }),
      })
    } catch {
      /* ignore */
    }
    await get().fetchChats()
  },

  async archiveChat(id: string, archived: boolean) {
    try {
      await fetch(`/api/chats/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived }),
      })
    } catch {
      /* ignore */
    }
    await get().fetchChats()
    if (get().activeChatId === id) {
      set({ activeChatId: null, messages: [] })
    }
  },

  async deleteChat(id: string) {
    try {
      await fetch(`/api/chats/${id}`, { method: 'DELETE' })
    } catch {
      /* ignore */
    }
    set((s) => ({
      chats: s.chats.filter((c) => c.id !== id),
      activeChatId: s.activeChatId === id ? null : s.activeChatId,
      messages: s.activeChatId === id ? [] : s.messages,
    }))
  },

  async sendMessage(content: string, attachments?: Attachment[]) {
    const trimmed = content.trim()
    const atts = attachments ?? []
    if ((!trimmed && atts.length === 0) || get().sending) return

    const activeId = get().activeChatId
    if (!activeId) return

    // Optimistic user message
    const tempUser: Message = {
      id: `temp-${Date.now()}`,
      chatId: activeId,
      role: 'user',
      content: trimmed || '(image attached)',
      attachments: atts.length > 0 ? atts : null,
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ messages: [...s.messages, tempUser], sending: true }))

    // ---- Real AI via Puter (client-side, no config needed) ----
    // When the user is signed into Puter, call window.puter.ai.chat() with
    // the conversation history to generate a real reply. Pass it to the API
    // as `assistantReply` so the server saves it directly (no z-ai SDK call
    // that would fail without .z-ai-config on the user's machine).
    let assistantReply: string | undefined
    try {
      const { getPuterReply } = await import('@/lib/puter')
      const history: { role: 'user' | 'assistant'; content: string }[] = [
        ...get().messages
          .filter((m) => m.id !== tempUser.id)
          .map((m) => ({
            role: (m.role === 'assistant' ? 'assistant' : 'user') as
              | 'user'
              | 'assistant',
            content: m.content,
          })),
        { role: 'user', content: trimmed || '(image attached)' },
      ]
      const reply = await getPuterReply(history, get().aiModel || undefined)
      if (reply && reply.trim()) assistantReply = reply.trim()
    } catch {
      /* puter not available — fall through to server-side z-ai */
    }

    try {
      const res = await fetch(`/api/chats/${activeId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: trimmed,
          attachments: atts,
          ...(assistantReply ? { assistantReply } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        // remove optimistic user message and add error bubble
        set((s) => ({
          messages: s.messages.filter((m) => m.id !== tempUser.id),
          sending: false,
        }))
        const errMsg: Message = {
          id: `err-${Date.now()}`,
          chatId: activeId,
          role: 'assistant',
          content: `⚠️ ${data?.error ?? 'Failed to send message'}. ${
            data?.detail ?? ''
          }`.trim(),
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ messages: [...s.messages, errMsg] }))
        return
      }

      // Replace optimistic user message with the real one and add assistant reply
      const realUser: Message = {
        ...(data.userMessage as Message),
        attachments: parseAttachments(
          (data.userMessage as Message & { attachments?: string | null })
            ?.attachments
        ),
      }
      const assistant = data.assistantMessage as Message
      set((s) => ({
        messages: [
          ...s.messages.filter((m) => m.id !== tempUser.id),
          realUser,
          assistant,
        ],
        sending: false,
      }))

      // If a new title was generated, update the chat list + bump message count
      set((s) => ({
        chats: s.chats.map((c) =>
          c.id === activeId
            ? {
                ...c,
                title: data.title ?? c.title,
                _count: {
                  messages: (c._count?.messages ?? 0) + 2, // user + assistant
                },
                updatedAt: new Date().toISOString(),
              }
            : c
        ),
      }))

      // Reorder: move active chat to top of sidebar (updatedAt changed)
      set((s) => {
        const active = s.chats.find((c) => c.id === activeId)
        if (!active) return {}
        const others = s.chats.filter((c) => c.id !== activeId)
        const pinned = others.filter((c) => c.pinned)
        const rest = others.filter((c) => !c.pinned)
        return { chats: [...pinned, { ...active, updatedAt: new Date().toISOString() }, ...rest] }
      })
    } catch (e) {
      set((s) => ({
        messages: s.messages.filter((m) => m.id !== tempUser.id),
        sending: false,
      }))
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        chatId: activeId,
        role: 'assistant',
        content: `⚠️ Network error: ${
          e instanceof Error ? e.message : 'Unknown error'
        }`,
        createdAt: new Date().toISOString(),
      }
      set((s) => ({ messages: [...s.messages, errMsg] }))
    }
  },

  async regenerate() {
    const activeId = get().activeChatId
    if (!activeId || get().sending) return false

    // Drop the trailing assistant message optimistically, if any,
    // and show a typing state.
    const msgs = get().messages
    let trimmed = msgs
    if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant') {
      trimmed = msgs.slice(0, -1)
    }
    set({ messages: trimmed, sending: true })

    try {
      const res = await fetch(`/api/chats/${activeId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok) {
        set({ sending: false })
        return false
      }
      const assistant = data.assistantMessage as Message
      set((s) => ({ messages: [...s.messages, assistant], sending: false }))
      return true
    } catch {
      set({ sending: false })
      return false
    }
  },

  async editUserMessage(id: string, content: string) {
    const trimmed = content.trim()
    if (!trimmed) return false
    const activeId = get().activeChatId
    if (!activeId || get().sending) return false

    set({ sending: true })

    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) {
        set({ sending: false })
        return false
      }
      const fresh = (data.messages ?? []) as Array<
        Message & { attachments?: string | null }
      >
      const parsed = fresh.map((m) => ({
        ...m,
        attachments: parseAttachments(m.attachments),
      }))
      set({ messages: parsed, sending: false })
      return true
    } catch {
      set({ sending: false })
      return false
    }
  },

  async invokeSkill(skill, prompt) {
    const activeId = get().activeChatId
    if (!activeId || get().sending) return false

    // Optimistic user message showing the slash command
    const tempUser: Message = {
      id: `temp-${Date.now()}`,
      chatId: activeId,
      role: 'user',
      content: skill === 'image' ? `/image ${prompt}` : `/video ${prompt}`,
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ messages: [...s.messages, tempUser], sending: true }))

    try {
      const res = await fetch('/api/skills/invoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: activeId, skill, prompt }),
      })
      const data = await res.json()
      if (!res.ok) {
        set((s) => ({
          messages: s.messages.filter((m) => m.id !== tempUser.id),
          sending: false,
        }))
        const errMsg: Message = {
          id: `err-${Date.now()}`,
          chatId: activeId,
          role: 'assistant',
          content: `⚠️ ${data?.error ?? 'Skill invocation failed'}`,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ messages: [...s.messages, errMsg] }))
        return false
      }

      const realUser = data.userMessage as Message
      const assistant: Message = {
        ...(data.assistantMessage as Message),
        attachments: parseAttachments(
          (data.assistantMessage as Message & { attachments?: string | null })
            ?.attachments
        ),
      }
      set((s) => ({
        messages: [
          ...s.messages.filter((m) => m.id !== tempUser.id),
          realUser,
          assistant,
        ],
        sending: false,
      }))

      // Reorder the chat to the top (updatedAt changed)
      set((s) => {
        const active = s.chats.find((c) => c.id === activeId)
        if (!active) return {}
        const others = s.chats.filter((c) => c.id !== activeId)
        const pinned = others.filter((c) => c.pinned)
        const rest = others.filter((c) => !c.pinned)
        return {
          chats: [
            ...pinned,
            { ...active, updatedAt: new Date().toISOString() },
            ...rest,
          ],
        }
      })
      return true
    } catch (e) {
      set((s) => ({
        messages: s.messages.filter((m) => m.id !== tempUser.id),
        sending: false,
      }))
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        chatId: activeId,
        role: 'assistant',
        content: `⚠️ Network error: ${
          e instanceof Error ? e.message : 'Unknown error'
        }`,
        createdAt: new Date().toISOString(),
      }
      set((s) => ({ messages: [...s.messages, errMsg] }))
      return false
    }
  },
}))
