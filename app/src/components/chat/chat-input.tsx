'use client'
// Mehrzad ArianMehr©

import { Send, StopCircle, Paperclip, X, ImageIcon, Sparkles } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useChatStore, type Attachment } from '@/lib/chat-store'
import { SKILLS, loadEnabledSkills, isSkillAvailable } from '@/lib/skills-registry'
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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
            'focus-within:border-amber-500/40 focus-within:shadow-[0_0_0_4px_rgba(245,158,11,0.12),0_8px_24px_-12px_rgba(0,0,0,0.18)]',
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
            className="uc-pressable uc-sheen h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm hover:from-amber-600 hover:to-orange-700 disabled:opacity-40"
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
