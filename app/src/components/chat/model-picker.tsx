// Mehrzad ArianMehr©
// Prominent, big, company-grouped AI model picker — used in the empty state
// so the user selects a model BEFORE starting a chat. Shares the same store
// state (aiModel) as the compact selector in the composer.

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ChevronDown, Check, Search } from 'lucide-react'
import { useChatStore, AI_MODELS } from '@/lib/chat-store'
import { getPuterModels, type PuterModel } from '@/lib/puter'
import { usePuterAuth } from '@/hooks/use-puter-auth'
import { useEffect } from 'react'
import { springSnappy } from '@/lib/motion-presets'
import { cn } from '@/lib/utils'

function providerLabel(p: string): string {
  const map: Record<string, string> = {
    claude: 'Anthropic · Claude',
    anthropic: 'Anthropic · Claude',
    gpt: 'OpenAI · GPT',
    openai: 'OpenAI · GPT',
    o1: 'OpenAI · o1',
    gemini: 'Google · Gemini',
    google: 'Google · Gemini',
    llama: 'Meta · Llama',
    meta: 'Meta · Llama',
    mistral: 'Mistral',
    groq: 'Groq',
    other: 'Other',
  }
  return map[p] || p.charAt(0).toUpperCase() + p.slice(1)
}

export function ModelPicker() {
  const aiModel = useChatStore((s) => s.aiModel)
  const setAiModel = useChatStore((s) => s.setAiModel)
  const { signedIn } = usePuterAuth()
  const [open, setOpen] = useState(false)
  const [puterModels, setPuterModels] = useState<PuterModel[]>([])
  const [query, setQuery] = useState('')

  // fetch the real model list from puter when signed in (state updates happen
  // inside the async callback, so no synchronous setState-in-effect)
  useEffect(() => {
    if (!signedIn) return
    let cancelled = false
    let tries = 0
    const tick = async () => {
      if (cancelled) return
      try {
        const models = await getPuterModels()
        if (cancelled) return
        if (models.length > 0) {
          setPuterModels(models)
          return
        }
      } catch {
        /* ignore */
      }
      tries += 1
      if (tries < 40 && !cancelled) setTimeout(tick, 500)
    }
    tick()
    return () => {
      cancelled = true
    }
  }, [signedIn])

  const options: { id: string; label: string; provider?: string; context?: number }[] =
    signedIn && puterModels.length > 0
      ? puterModels.map((m) => ({
          id: m.id,
          label: m.name || m.id,
          provider: m.provider,
          context: m.context,
        }))
      : AI_MODELS.map((m) => ({ id: m.id, label: m.label, provider: m.vendor }))

  const groups = new Map<string, typeof options>()
  for (const o of options) {
    const key = (o.provider || 'other').toLowerCase()
    const arr = groups.get(key) ?? []
    arr.push(o)
    groups.set(key, arr)
  }

  const filteredGroups = Array.from(groups.entries())
    .map(([provider, items]) => [
      provider,
      query
        ? items.filter((o) =>
            (o.label + ' ' + o.id + ' ' + provider).toLowerCase().includes(query.toLowerCase())
          )
        : items,
    ])
    .filter(([, items]) => (items as typeof options).length > 0) as [string, typeof options][]

  const current =
    options.find((o) => o.id === aiModel) ||
    options[0] || { id: aiModel, label: aiModel }

  return (
    <div className="relative w-full max-w-md">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="uc-pressable uc-focus group flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/4 p-3 text-left transition hover:bg-white/8"
      >
        <span className="uc-iridescent flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm">
          <Sparkles className="h-5 w-5 text-white" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="uc-tiny font-medium uppercase tracking-wide text-muted-foreground">
            AI Model
          </div>
          <div className="truncate text-[15px] font-semibold">{current.label}</div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-medium text-white/70">
          Change <ChevronDown className="h-3 w-3" />
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-[8px]"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={springSnappy}
              className="uc-glass-strong uc-scroll relative max-h-[80vh] w-full max-w-lg overflow-hidden rounded-3xl"
            >
              {/* header */}
              <div className="border-b border-white/8 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[17px] font-semibold tracking-tight">Select AI model</h3>
                  <span className="uc-tiny text-white/40">
                    {puterModels.length > 0 ? `${options.length} models` : 'built-in · sign in for more'}
                  </span>
                </div>
                {/* search */}
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-3 py-2">
                  <Search className="h-3.5 w-3.5 text-white/40" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search models…"
                    className="flex-1 bg-transparent text-[13px] focus:outline-none"
                  />
                </div>
              </div>

              {/* grouped list */}
              <div className="uc-scroll max-h-[52vh] overflow-y-auto p-2">
                {filteredGroups.length === 0 && (
                  <div className="px-3 py-8 text-center text-[13px] text-muted-foreground">
                    No models match “{query}”.
                  </div>
                )}
                {filteredGroups.map(([provider, items]) => (
                  <div key={provider} className="mb-3">
                    <div className="uc-tiny uc-text-iridescent mb-1.5 px-2 font-semibold uppercase tracking-wide">
                      {providerLabel(provider)}
                    </div>
                    {items.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => {
                          setAiModel(o.id)
                          setOpen(false)
                          setQuery('')
                        }}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-white/8',
                          o.id === aiModel ? 'bg-white/10' : ''
                        )}
                      >
                        <span className="uc-iridescent-soft flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold uppercase">
                          {(o.provider || '?').slice(0, 2)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14px] font-medium">{o.label}</div>
                          {o.context ? (
                            <div className="text-[11px] text-muted-foreground">
                              {(o.context / 1000).toFixed(0)}K context window
                            </div>
                          ) : (
                            <div className="truncate text-[11px] text-muted-foreground">{o.id}</div>
                          )}
                        </div>
                        {o.id === aiModel && (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/25">
                            <Check className="h-3.5 w-3.5 text-violet-300" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              {/* footer hint */}
              {!signedIn && (
                <div className="border-t border-white/8 px-4 py-2.5 text-center text-[11px] text-muted-foreground">
                  Sign in with Puter (bottom of the sidebar) to load every available model.
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
