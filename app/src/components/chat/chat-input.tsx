'use client'
// Mehrzad ArianMehr©

import { Send, StopCircle, Paperclip, X, ImageIcon, Sparkles, ChevronDown, Check } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useChatStore, AI_MODELS, type Attachment, type AiModel } from '@/lib/chat-store'
import { SKILLS, loadEnabledSkills, isSkillAvailable } from '@/lib/skills-registry'
import { getPuterModels, type PuterModel } from '@/lib/puter'
import { springSnappy } from '@/lib/motion-presets'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const MAX_FILES = 6
const ACCEPT =
  'image/png,image/jpeg,image/jpg,image/gif,image/webp,image/bmp,text/plain,text/markdown,application/pdf'

export function ChatInput({ chatId }: { chatId: string | null }) {
  const [value, setValue] = useState('')
  const [atts, setAtts] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [skillsEnabled, setSkillsEnabled] = useState<Record<string, boolean>>(
    () => loadEnabledSkills()
  )
  // re-sync enabled-state when the window regains focus (user may toggle in panel)
  useEffect(() => {
    const onFocus = () => setSkillsEnabled(loadEnabledSkills())
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const sending = useChatStore((s) => s.sending)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const invokeSkill = useChatStore((s) => s.invokeSkill)
  const aiModel = useChatStore((s) => s.aiModel)
  const setAiModel = useChatStore((s) => s.setAiModel)
  const [puterModels, setPuterModels] = useState<PuterModel[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // fetch the real model list from Puter when it's ready
  useEffect(() => {
    let cancelled = false
    let tries = 0
    const tick = async () => {
      if (cancelled) return
      try {
        const models = await getPuterModels()
        if (!cancelled && models.length > 0) {
          setPuterModels(models)
          return
        }
      } catch {
        /* ignore */
      }
      tries += 1
      if (tries < 60) setTimeout(tick, 500)
    }
    tick()
    return () => {
      cancelled = true
    }
  }, [])

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [value])

  function submit() {
    const text = value.trim()
    if ((!text && atts.length === 0) || sending || !chatId) return

    // Detect slash commands for enabled skills
    const slashMatch = text.match(/^(\/(?:image|video))\s+(.*)$/i)
    if (slashMatch) {
      const cmd = slashMatch[1].toLowerCase()
      const prompt = slashMatch[2].trim()
      if (!prompt) {
        toast.error('Please provide a prompt after the command')
        return
      }
      // find the matching skill that is enabled
      const skillId =
        cmd === '/image'
          ? 'nano-banana-prompting'
          : 'seedance-25-prompts'
      const skill = SKILLS.find((s) => s.id === skillId)
      if (!skill || !isSkillAvailable(skill, skillsEnabled)) {
        toast.error(
          `The ${cmd} skill is not enabled. Open Skills (✨) to enable it.`,
          { description: skill ? undefined : 'Skill not found.' }
        )
        return
      }
      setValue('')
      setAtts([])
      void invokeSkill(cmd === '/image' ? 'image' : 'video', prompt)
      return
    }

    setValue('')
    const toSend = atts
    setAtts([])
    void sendMessage(text, toSend.length > 0 ? toSend : undefined)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  async function onPickFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const room = MAX_FILES - atts.length
    if (room <= 0) {
      toast.error(`Max ${MAX_FILES} attachments per message`)
      return
    }
    const picked = Array.from(files).slice(0, room)
    setUploading(true)
    try {
      const uploaded: Attachment[] = []
      for (const f of picked) {
        const fd = new FormData()
        fd.append('file', f)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) {
          toast.error(`Could not upload ${f.name}`, {
            description: data?.error,
          })
          continue
        }
        uploaded.push(data.attachment as Attachment)
      }
      setAtts((cur) => [...cur, ...uploaded])
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function removeAttachment(id: string) {
    setAtts((cur) => cur.filter((a) => a.id !== id))
  }

  const disabled = !chatId
  const hasContent = value.trim().length > 0 || atts.length > 0
  const canSend = hasContent && !sending && !uploading

  return (
    <div className="relative z-10 border-t border-border/40 bg-gradient-to-t from-background via-background/95 to-transparent px-3 pb-4 pt-3 backdrop-blur-xl sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        {/* Attachment preview chips */}
        <AnimatePresence>
          {atts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={springSnappy}
              className="mb-2 flex flex-wrap gap-2 overflow-hidden"
            >
              {atts.map((a) => (
                <motion.div
                  key={a.id}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={springSnappy}
                  className="group relative"
                >
                  {a.isImage ? (
                    <div className="relative h-16 w-16 overflow-hidden rounded-xl ring-1 ring-black/10 dark:ring-white/10">
                      { }
                      <img
                        src={a.url}
                        alt={a.name}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeAttachment(a.id)}
                        className="absolute right-0.5 top-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-black/80"
                        aria-label={`Remove ${a.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="uc-pressable relative inline-flex h-9 items-center gap-1.5 rounded-xl bg-muted px-2.5 text-xs ring-1 ring-black/10 dark:ring-white/10">
                      <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="max-w-[120px] truncate font-medium">
                        {a.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(a.id)}
                        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition hover:bg-background hover:text-foreground"
                        aria-label={`Remove ${a.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={cn(
            'relative flex items-end gap-2 rounded-[22px] border bg-card/80 p-2 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_8px_24px_-12px_rgba(0,0,0,0.18)] backdrop-blur-xl transition',
            'focus-within:border-violet-500/40 focus-within:shadow-[0_0_0_4px_rgba(139,92,246,0.12),0_8px_24px_-12px_rgba(0,0,0,0.18)]',
            disabled && 'opacity-60'
          )}
        >
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="uc-pressable h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                  disabled={disabled || uploading || atts.length >= MAX_FILES}
                  onClick={() => fileRef.current?.click()}
                  aria-label="Attach file"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Attach image or file (max {MAX_FILES})
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => {
              void onPickFiles(e.target.files)
            }}
          />

          <ModelSelector
            aiModel={aiModel}
            setAiModel={setAiModel}
            puterModels={puterModels}
          />

          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={
              chatId
                ? 'Message Unlimited Claude…  (⏎ to send, ⇧⏎ for newline)'
                : 'Start a new chat to begin…'
            }
            rows={1}
            disabled={disabled}
            data-chat-input=""
            className="uc-scroll min-h-[40px] max-h-[200px] flex-1 resize-none border-0 bg-transparent p-2 text-[0.95rem] shadow-none focus-visible:ring-0"
          />

          <Button
            type="button"
            size="icon"
            onClick={submit}
            disabled={!canSend}
            className="uc-pressable uc-sheen h-9 w-9 shrink-0 rounded-full uc-iridescent text-white shadow-sm  disabled:opacity-40"
            aria-label={sending ? 'Sending' : 'Send message'}
          >
            {sending || uploading ? (
              <StopCircle className="h-4 w-4 animate-pulse" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Unlimited Claude can make mistakes. Verify important info.
        </p>
      </div>
    </div>
  )
}

/**
 * Model selector dropdown — shows the models Puter exposes (fetched via
 * puter.ai.listModels()) when signed in, falling back to a built-in list.
 */
function ModelSelector({
  aiModel,
  setAiModel,
  puterModels,
}: {
  aiModel: string
  setAiModel: (id: string) => void
  puterModels: PuterModel[]
}) {
  const [open, setOpen] = useState(false)

  // build the option list: prefer puter's real list; fall back to built-ins
  const options: { id: string; label: string; provider?: string }[] =
    puterModels.length > 0
      ? puterModels.map((m) => ({
          id: m.id,
          label: m.name || m.id,
          provider: m.provider,
        }))
      : AI_MODELS.map((m) => ({ id: m.id, label: m.label, provider: m.vendor }))

  const current =
    options.find((o) => o.id === aiModel) ||
    options[0] || { id: aiModel, label: aiModel }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="uc-pressable inline-flex h-9 max-w-[150px] items-center gap-1 rounded-full px-2.5 text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        title="Select AI model"
      >
        <Sparkles className="h-3.5 w-3.5 uc-text-iridescent" />
        <span className="truncate">{current.label}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 transition', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={springSnappy}
              className="uc-glass-strong uc-scroll absolute bottom-11 left-0 z-30 max-h-72 w-64 overflow-y-auto rounded-2xl p-1"
            >
              {options.length === 0 && (
                <div className="px-3 py-4 text-center text-[12px] text-muted-foreground">
                  Sign in with Puter to load models.
                </div>
              )}
              {options.map((o) => (
                <button
                  key={o.id}
                  onClick={() => {
                    setAiModel(o.id)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition hover:bg-white/8',
                    o.id === aiModel ? 'bg-white/8' : ''
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-medium">{o.label}</div>
                    {o.provider && (
                      <div className="text-[10px] text-muted-foreground">{o.provider}</div>
                    )}
                  </div>
                  {o.id === aiModel && <Check className="h-3.5 w-3.5 text-violet-400" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
