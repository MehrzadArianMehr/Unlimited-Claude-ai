'use client'
// Mehrzad ArianMehr©

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { SKILLS, loadEnabledSkills, saveEnabledSkills, type SkillDef } from '@/lib/skills-registry'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function SkillsPanel({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  // The sheet content only mounts when opened (client-side), so reading
  // localStorage in a lazy initializer is safe and avoids a setState-in-effect.
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    loadEnabledSkills()
  )

  function toggle(id: string, on: boolean) {
    const next = { ...enabled, [id]: on }
    setEnabled(next)
    saveEnabledSkills(next)
    const s = SKILLS.find((x) => x.id === id)
    toast.success(`${s?.name ?? 'Skill'} ${on ? 'enabled' : 'disabled'}`)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="uc-scroll w-[360px] overflow-y-auto p-0 sm:max-w-[400px]">
        {/* gradient header */}
        <div className="uc-material relative border-b border-border/40 px-5 pb-4 pt-6">
          <SheetHeader className="space-y-1 p-0">
            <SheetTitle className="flex items-center gap-2 text-left text-lg font-semibold tracking-tight">
              <span className="text-xl">✨</span> Skills
            </SheetTitle>
            <SheetDescription className="text-left text-[13px]">
              Enable AI skills to generate images and videos straight from
              chat. Trigger them with slash commands like{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-[11px]">/image</code>{' '}
              and{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-[11px]">/video</code>.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="space-y-3 p-4">
          {SKILLS.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              enabled={Boolean(enabled[skill.id])}
              onToggle={(on) => toggle(skill.id, on)}
            />
          ))}

          <div className="mt-4 rounded-2xl border border-dashed border-border/60 p-3.5 text-[12px] leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">How to use</p>
            <ol className="mt-1.5 list-decimal space-y-0.5 pl-4">
              <li>Enable a skill with the toggle on the right.</li>
              <li>
                In the chat input, type{' '}
                <code className="rounded bg-muted px-1">/image</code> or{' '}
                <code className="rounded bg-muted px-1">/video</code> followed
                by your prompt.
              </li>
              <li>Press ⏎ — the result appears inline as a message.</li>
            </ol>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function SkillCard({
  skill,
  enabled,
  onToggle,
}: {
  skill: SkillDef
  enabled: boolean
  onToggle: (on: boolean) => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-card/60 p-3.5 transition',
        enabled ? 'border-border' : 'border-border/50 opacity-80'
      )}
    >
      {/* accent bar */}
      <div
        className={cn(
          'absolute inset-y-0 left-0 w-1 bg-gradient-to-b',
          skill.accent
        )}
      />
      <div className="flex items-start gap-3 pl-1.5">
        <div
          className={cn(
            'uc-pressable flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-lg shadow-sm',
            skill.accent
          )}
        >
          {skill.glyph}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[14px] font-semibold tracking-tight">
              {skill.name}
            </h3>
            {enabled && (
              <Badge
                variant="secondary"
                className="h-5 bg-emerald-500/15 px-1.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300"
              >
                ON
              </Badge>
            )}
          </div>
          <p className="uc-tiny text-muted-foreground">{skill.tagline}</p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
            {skill.description}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <code className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium">
              {skill.usage}
            </code>
            {skill.sourceFile && (
              <span className="uc-tiny truncate text-muted-foreground/70">
                {skill.sourceFile}
              </span>
            )}
          </div>
        </div>

        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          aria-label={`Toggle ${skill.name}`}
          className="mt-1 shrink-0"
        />
      </div>

      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="overflow-hidden pl-1.5"
          >
            <div className="mt-2.5 rounded-xl bg-muted/40 p-2">
              <div className="uc-tiny mb-1 font-medium uppercase tracking-wide text-muted-foreground">
                Try it
              </div>
              <div className="flex flex-wrap gap-1.5">
                {skill.examples.map((ex) => (
                  <span
                    key={ex}
                    className="rounded-md bg-background px-2 py-1 text-[11px] ring-1 ring-inset ring-border/60"
                  >
                    {ex}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
