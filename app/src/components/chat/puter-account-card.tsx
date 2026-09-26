'use client'
// Mehrzad ArianMehr©

import { useEffect, useRef, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, MoreHorizontal, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePuterAuth } from '@/hooks/use-puter-auth'
import { useChatStore } from '@/lib/chat-store'
import { springSnappy } from '@/lib/motion-presets'
import { toast } from 'sonner'

/** Stylised Puter mark (geometric "P" monogram on a gradient). */
export function PuterMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="24" height="24" rx="6" fill="url(#puter-grad)" />
      <path
        d="M8 17V7h4.2c1.9 0 3.1 1 3.1 2.6 0 1.7-1.2 2.7-3.1 2.7h-1.9V17H8zm2.3-5.6h1.5c.7 0 1.2-.4 1.2-1.1 0-.7-.5-1.1-1.2-1.1h-1.5v2.2z"
        fill="white"
      />
      <defs>
        <linearGradient id="puter-grad" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/**
 * The account section at the bottom of the sidebar.
 *
 * - While puter.js is still loading: a subtle "Connecting…" card.
 * - Not signed in: a prominent "Login with Puter" button (the section the
 *   user asked to add back). Any `children` passed in are rendered below the
 *   button so the app can offer a local-name fallback.
 * - Signed in: the puter user's avatar + username + a dropdown (Sign out).
 *   On sign-in, the puter username is synced to the local profile name.
 */
export function PuterAccountCard({ children }: { children?: ReactNode }) {
  const { signedIn, user, ready, signingIn, error, signIn, signOut } =
    usePuterAuth()
  const profile = useChatStore((s) => s.profile)
  const renameUser = useChatStore((s) => s.renameUser)
  const fetchProfile = useChatStore((s) => s.fetchProfile)

  // Sync the puter username to the local profile on first sign-in.
  const syncedRef = useRef<string | null>(null)
  useEffect(() => {
    if (signedIn && user?.username && syncedRef.current !== user.username) {
      syncedRef.current = user.username
      if (!profile?.name || profile.name === 'User') {
        void renameUser(user.username).then(() => void fetchProfile())
      }
    }
  }, [signedIn, user?.username, profile?.name, renameUser, fetchProfile])

  async function handleSignIn() {
    await signIn()
    if (error) toast.error(error)
  }

  function handleSignOut() {
    signOut()
    toast.success('Signed out of Puter')
  }

  // ---- Still loading puter.js ----
  if (signedIn === null && !ready) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-accent/30 p-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="uc-tiny mt-1 text-muted-foreground">
            Connecting to Puter…
          </div>
        </div>
      </div>
    )
  }

  // ---- Not signed in: Login button + optional local-name fallback ----
  if (!signedIn) {
    return (
      <div className="space-y-2">
        <Button
          onClick={handleSignIn}
          disabled={signingIn}
          className="uc-pressable uc-sheen w-full justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm hover:from-emerald-600 hover:to-teal-700"
        >
          {signingIn ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <PuterMark className="h-4 w-4" />
          )}
          {signingIn ? 'Opening Puter…' : 'Login with Puter'}
        </Button>
        <p className="uc-tiny text-center text-muted-foreground">
          {error ? error : 'Free unlimited AI via your own Puter account'}
        </p>
        {children}
      </div>
    )
  }

  // ---- Signed in: account card with dropdown ----
  const displayName = user?.username || profile?.name || 'User'
  const initials = displayName
    .split(/[\s_-]+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="uc-pressable group relative flex items-center gap-3 rounded-2xl bg-accent/40 p-2.5 ring-1 ring-inset ring-black/5 dark:ring-white/5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[13px] font-semibold text-white shadow-sm">
        {user?.pic ? (
           
          <img
            src={user.pic}
            alt={displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          initials || 'U'
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium">{displayName}</div>
        <div className="uc-tiny flex items-center gap-1 text-muted-foreground">
          <PuterMark className="h-3 w-3" />
          <span className="truncate">{user?.email || 'Puter account'}</span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="uc-pressable inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition hover:bg-background hover:text-foreground group-hover:opacity-100 focus:opacity-100"
            aria-label="Account options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() =>
              toast.message('Username comes from your Puter account', {
                description: 'Sign out to use a local name instead.',
              })
            }
          >
            <span className="font-medium">{displayName}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* "connected" status pill */}
      <AnimatePresence>
        <motion.span
          layout
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springSnappy}
          className="absolute right-2 top-2 inline-flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background"
          title="Connected to Puter"
        />
      </AnimatePresence>
    </div>
  )
}
