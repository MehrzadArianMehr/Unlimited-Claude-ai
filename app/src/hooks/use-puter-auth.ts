'use client'
// Mehrzad ArianMehr©

import { useCallback, useEffect, useRef, useState } from 'react'
import type { PuterUser } from '@/lib/puter'

export type PuterAuthState = {
  /** null = still checking; false = definitely not signed in; true = signed in */
  signedIn: boolean | null
  user: PuterUser | null
  /** puter.js finished loading (window.puter is available) */
  ready: boolean
  /** a login is in progress (popup open) */
  signingIn: boolean
  /** last error message from a failed sign-in / load */
  error: string | null
}

export type PuterAuth = PuterAuthState & {
  signIn: () => Promise<void>
  signOut: () => void
  refresh: () => Promise<void>
}

/**
 * Polls for `window.puter` to finish loading, then tracks the user's
 * puter auth state. signIn() opens the puter popup; signOut() clears it.
 */
export function usePuterAuth(): PuterAuth {
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [user, setUser] = useState<PuterUser | null>(null)
  const [ready, setReady] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timers = useRef<ReturnType<typeof setInterval> | null>(null)

  // Wait for window.puter to be defined (script loads async)
  useEffect(() => {
    let cancelled = false
    let tries = 0
    const tick = () => {
      if (cancelled) return
      if (typeof window !== 'undefined' && window.puter?.auth) {
        setReady(true)
        void refresh()
        return
      }
      tries += 1
      if (tries > 120) {
        // ~12s with 100ms interval — give up, show not-signed-in
        setReady(false)
        setSignedIn(false)
        return
      }
      timers.current = setTimeout(tick, 100)
    }
    tick()
    return () => {
      cancelled = true
      if (timers.current) clearTimeout(timers.current)
    }
     
  }, [])

  const refresh = useCallback(async () => {
    if (typeof window === 'undefined' || !window.puter?.auth) {
      setSignedIn(false)
      return
    }
    try {
      const isSigned = window.puter.auth.isSignedIn()
      setSignedIn(Boolean(isSigned))
      if (isSigned) {
        try {
          const u = await window.puter.auth.getUser()
          setUser(u ?? null)
        } catch {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch {
      setSignedIn(false)
    }
  }, [])

  const signIn = useCallback(async () => {
    if (typeof window === 'undefined' || !window.puter?.auth) {
      setError(
        'Puter failed to load. Check your connection and reload the page.'
      )
      return
    }
    setSigningIn(true)
    setError(null)
    try {
      await window.puter.auth.signIn()
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Puter sign-in failed')
    } finally {
      setSigningIn(false)
    }
  }, [refresh])

  const signOut = useCallback(() => {
    if (typeof window === 'undefined' || !window.puter?.auth) return
    try {
      void window.puter.auth.signOut()
      setSignedIn(false)
      setUser(null)
    } catch {
      /* ignore */
    }
  }, [])

  return { signedIn, user, ready, signingIn, error, signIn, signOut, refresh }
}
