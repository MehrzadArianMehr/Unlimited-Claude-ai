// Mehrzad ArianMehr©
/**
 * Minimal TypeScript declarations for the puter.js global SDK + a helper
 * to call puter.ai.chat() client-side (no config file needed — uses the
 * user's own Puter account for free AI).
 */

export type PuterUser = {
  uuid?: string
  username?: string
  email?: string
  email_confirmed?: boolean
  pic?: string | null
  [key: string]: unknown
}

type PuterAuth = {
  isSignedIn: () => boolean
  signIn: () => Promise<PuterUser>
  signOut: () => void | Promise<void>
  getUser: () => Promise<PuterUser>
}

type PuterAIChat = (
  prompt: string | Array<{ role: string; content: string }>,
  options?: { model?: string; stream?: boolean; [k: string]: unknown }
) => Promise<unknown>

export type PuterModel = {
  id: string
  provider?: string
  name?: string
  aliases?: string[]
  context?: number
  max_tokens?: number
  cost?: { currency?: string; tokens?: number; input?: number; output?: number }
  [k: string]: unknown
}

type PuterAI = {
  chat: PuterAIChat
  listModels?: (provider?: string) => Promise<PuterModel[]>
}

type PuterGlobal = {
  auth: PuterAuth
  ai: PuterAI
  print?: (...args: unknown[]) => void
}

declare global {
  interface Window {
    puter?: PuterGlobal
  }
   
  const puter: PuterGlobal | undefined
}

const SYSTEM_PROMPT =
  'You are "Unlimited Claude", a helpful, friendly and knowledgeable AI assistant. ' +
  'You answer clearly and concisely, use Markdown when useful, and stay safe and respectful.'

export type ChatTurn = { role: 'user' | 'assistant'; content: string }

/**
 * Call puter.ai.chat() with the conversation history (client-side).
 * Returns the AI reply text, or null if Puter isn't loaded / not signed in.
 *
 * This requires the user to be signed into Puter (via the "Login with
 * Puter" button in the sidebar). When signed in, Puter provides free
 * AI access through the user's own account — no .z-ai-config needed.
 */
export async function getPuterReply(
  history: ChatTurn[],
  model?: string
): Promise<string | null> {
  if (typeof window === 'undefined') return null
  const puter = window.puter
  if (!puter?.ai?.chat) return null
  try {
    if (typeof puter.auth?.isSignedIn === 'function' && !puter.auth.isSignedIn()) {
      return null
    }
  } catch {
    /* ignore */
  }

  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ]

  const opts: { stream: boolean; model?: string } = { stream: false }
  if (model) opts.model = model

  try {
    const res = await puter.ai.chat(messages, opts)
    // puter.ai.chat may return a string, or { message: { content } }, or { content }
    if (typeof res === 'string') return res
    if (res && typeof res === 'object') {
      const r = res as {
        message?: { content?: unknown }
        content?: unknown
        text?: unknown
        toString?: () => string
      }
      if (typeof r.message?.content === 'string') return r.message.content
      if (typeof r.content === 'string') return r.content
      if (typeof r.text === 'string') return r.text
      if (typeof r.toString === 'function') {
        const s = r.toString()
        if (s && s !== '[object Object]') return s
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Fetch the AI models Puter currently exposes (via puter.ai.listModels()).
 * Returns an empty array if Puter isn't loaded / not signed in.
 */
export async function getPuterModels(): Promise<PuterModel[]> {
  if (typeof window === 'undefined') return []
  const puter = window.puter
  if (!puter?.ai?.listModels) return []
  try {
    if (typeof puter.auth?.isSignedIn === 'function' && !puter.auth.isSignedIn()) {
      return []
    }
    const models = await puter.ai.listModels()
    return Array.isArray(models) ? models : []
  } catch {
    return []
  }
}

/** Is Puter available + the user signed in? (client-side) */
export function isPuterReady(): boolean {
  if (typeof window === 'undefined') return false
  const p = window.puter
  if (!p?.ai?.chat) return false
  try {
    return typeof p.auth?.isSignedIn === 'function' ? p.auth.isSignedIn() : false
  } catch {
    return false
  }
}

export {}
