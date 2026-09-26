// Mehrzad ArianMehr©
// PuterConnectPrompt — prominent modal that appears when the user tries to
// chat but isn't signed into Puter (the only way to get real AI without the
// sandbox's .z-ai-config). One click → opens the Puter sign-in popup, then
// re-sends the queued message.

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useChatStore } from '@/lib/chat-store'
import { springSnappy } from '@/lib/motion-presets'

export function PuterConnectPrompt() {
  const show = useChatStore((s) => s.showPuterPrompt)
  const dismiss = useChatStore((s) => s.dismissPuterPrompt)
  const connectPuterAndSend = useChatStore((s) => s.connectPuterAndSend)
  const [connecting, setConnecting] = useState(false)

  async function handleConnect() {
    setConnecting(true)
    await connectPuterAndSend()
    setConnecting(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[8px]"
            onClick={dismiss}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={springSnappy}
            className="uc-glass-strong relative w-full max-w-[400px] rounded-3xl p-6 text-center"
          >
            <button
              onClick={dismiss}
              className="absolute right-4 top-4 inline-flex h-7 w-7 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-[0_8px_24px_-8px_rgba(16,185,129,0.5)]">
              <Sparkles className="h-6 w-6 text-white" />
            </div>

            <h2 className="text-xl font-semibold tracking-tight">
              Connect to AI
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-white/55">
              To get <strong className="text-white/85">real AI replies</strong>,
              sign in with your free{' '}
              <a
                href="https://puter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 underline underline-offset-2"
              >
                Puter
              </a>{' '}
              account. Puter provides unlimited Claude, GPT, Gemini &amp; Llama
              access — no API key, no config file, completely free.
            </p>

            <button
              onClick={handleConnect}
              disabled={connecting}
              className="uc-pressable mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-[14px] font-semibold text-white shadow-sm disabled:opacity-60"
            >
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Opening Puter…
                </>
              ) : (
                'Login with Puter'
              )}
            </button>
            <button
              onClick={dismiss}
              className="mt-2 w-full py-2 text-[12px] text-white/40 hover:text-white/70"
            >
              Maybe later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
