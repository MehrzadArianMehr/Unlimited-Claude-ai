// Mehrzad ArianMehr©
/**
 * Minimal TypeScript declarations for the puter.js global SDK.
 * Docs: https://developer.puter.com / https://js.puter.com/v2/
 * Only the auth surface we use is typed here.
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
  prompt: string | { prompt: string; [k: string]: unknown },
  options?: { model?: string; stream?: boolean; [k: string]: unknown }
) => Promise<string>

type PuterAI = {
  chat: PuterAIChat
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

export {};
