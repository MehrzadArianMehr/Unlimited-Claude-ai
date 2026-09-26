// Mehrzad ArianMehr©
// HelpPopup — shows on first load with tips about saving tokens and
// choosing the right Claude model via Puter. Dismissed once = remembered
// via localStorage; can be re-opened via the help button in the sidebar.

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Coins, Info, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useChatStore } from '@/lib/chat-store'
import { AI_MODELS } from '@/lib/chat-store'
import { springSnappy } from '@/lib/motion-presets'

const STORAGE_KEY = 'uc.helpSeen.v1'

export function HelpPopup() {
  const [show, setShow] = useState(() => {
    try {
      return !window.localStorage.getItem(STORAGE_KEY)
    } catch {
      return true
    }
  })
  const setAiModel = useChatStore((s) => s.setAiModel)

  function dismiss() {
    setShow(false)
    try {
      window.localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-[10px]"
            onClick={dismiss}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={springSnappy}
            className="uc-glass-strong uc-scroll relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl p-6"
          >
            <button
              onClick={dismiss}
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            {/* header */}
            <div className="mb-5 flex items-center gap-3">
              <div className="uc-iridescent flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Welcome to Unlimited Claude
                </h2>
                <p className="uc-tiny text-muted-foreground">
                  Tips to save tokens &amp; use AI longer
                </p>
              </div>
            </div>

            {/* content */}
            <div className="space-y-3">
              {/* tip 1 */}
              <TipCard
                icon={<Coins className="h-4 w-4" />}
                title="Use Sonnet 4 to save tokens"
                accent="from-violet-500/20 to-blue-500/20"
              >
                <p>
                  To <strong className="text-white/90">save tokens</strong> and use
                  Claude AI for a <strong className="text-white/90">long time</strong>,
                  make sure to use the model{' '}
                  <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[12px]">
                    claude-sonnet-4
                  </span>{' '}
                  (Sonnet 4).
                </p>
              </TipCard>

              {/* tip 2 */}
              <TipCard
                icon={<Info className="h-4 w-4" />}
                title="Sonnet 4.5 is great but costs more credits"
                accent="from-pink-500/20 to-purple-500/20"
              >
                <p>
                  <span className="font-mono text-[12px]">claude-sonnet-4.5</span> (Sonnet
                  4.5) is also excellent, but it{' '}
                  <strong className="text-amber-400">consumes more credits</strong> per
                  message. Use it when you need the extra quality.
                </p>
              </TipCard>

              {/* tip 3 */}
              <TipCard
                icon={<Info className="h-4 w-4" />}
                title="Avoid other models on the free plan"
                accent="from-amber-500/20 to-orange-500/20"
              >
                <p>
                  Do <strong className="text-red-400">not</strong> use other models
                  (GPT, Gemini, Llama, etc.) unless you have purchased a{' '}
                  <strong className="text-white/90">Puter subscription</strong>.
                  Free-tier users should stick to{' '}
                  <strong className="text-emerald-400">Sonnet 4 or 4.5</strong> to
                  maximize their free usage.
                </p>
              </TipCard>

              {/* connect puter reminder */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <span className="text-[13px] font-semibold text-emerald-300">
                    To get started
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/60">
                  Sign in with <strong className="text-white/90">Puter</strong> (the green
                  button at the bottom of the sidebar) to unlock free, unlimited Claude AI.
                  Then pick the <strong className="text-white/90">Sonnet 4</strong> model
                  from the model selector before you start chatting.
                </p>
              </div>
            </div>

            {/* actions */}
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  // auto-select Sonnet 4 if it's in the list
                  const sonnet4 = AI_MODELS.find(
                    (m) => m.id.includes('sonnet-4') && !m.id.includes('4.5')
                  )
                  if (sonnet4) setAiModel(sonnet4.id)
                  dismiss()
                }}
                className="uc-pressable uc-sheen flex-1 rounded-2xl uc-iridescent py-3 text-[14px] font-semibold text-white shadow-sm"
              >
                <span className="flex items-center justify-center gap-2">
                  Got it — use Sonnet 4
                  <ChevronRight className="h-4 w-4" />
                </span>
              </button>
              <button
                onClick={dismiss}
                className="uc-pressable rounded-2xl border border-white/10 px-5 py-3 text-[13px] font-medium text-white/60 hover:bg-white/8 hover:text-white"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function TipCard({
  icon,
  title,
  children,
  accent,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
  accent: string
}) {
  return (
    <div className={`rounded-2xl border border-white/8 bg-gradient-to-r ${accent} p-3.5`}>
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-white/70">{icon}</span>
        <span className="text-[13px] font-semibold text-white/90">{title}</span>
      </div>
      <div className="text-[13px] leading-relaxed text-white/60">{children}</div>
    </div>
  )
}
