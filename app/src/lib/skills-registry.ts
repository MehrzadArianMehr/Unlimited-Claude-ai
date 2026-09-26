// Mehrzad ArianMehr©
/**
 * Skills available in Unlimited Claude.
 *
 * Each skill maps to a real backend capability (image gen, video gen) or is a
 * reference/template skill. The user enables/disables them in the Skills panel;
 * enabled skills can be invoked from the chat via slash commands.
 */

export type SkillCategory = 'image' | 'video' | 'developer'

export type SkillDef = {
  /** stable id used in localStorage + slash commands */
  id: string
  /** display name */
  name: string
  /** short tagline shown in the panel */
  tagline: string
  /** longer description */
  description: string
  /** the file the skill was imported from (for traceability) */
  sourceFile?: string
  category: SkillCategory
  /** slash command trigger, e.g. "/image" */
  command: string
  /** usage hint shown in the chat input */
  usage: string
  /** example prompts */
  examples: string[]
  /** brand accent (Tailwind gradient classes) */
  accent: string
  /** emoji or short mark for the avatar */
  glyph: string
  /** whether this skill is wired to a working backend endpoint */
  actionable: boolean
}

export const SKILLS: SkillDef[] = [
  {
    id: 'nano-banana-prompting',
    name: 'Nano Banana Prompting',
    tagline: 'AI image generation',
    description:
      'Generate high-quality images from text prompts using the Nano Banana model. Supports square, portrait, and landscape outputs. Trigger with /image.',
    sourceFile: 'nano-banana-prompting-1.0.0.tar.gz',
    category: 'image',
    command: '/image',
    usage: '/image <your prompt>',
    examples: [
      '/image a red apple on a white background',
      '/image futuristic city at sunset, wide landscape',
    ],
    accent: 'from-fuchsia-500 to-pink-600',
    glyph: '🍌',
    actionable: true,
  },
  {
    id: 'seedance-25-prompts',
    name: 'Seedance 2.5 Prompts',
    tagline: 'AI video generation',
    description:
      'Create short AI videos from text prompts using the Seedance 2.5 model. 5–10s clips, speed or quality mode. Trigger with /video.',
    sourceFile: 'awesome-seedance-2.5-prompts-skills.md',
    category: 'video',
    command: '/video',
    usage: '/video <your prompt>',
    examples: [
      '/video a cat playing with a ball',
      '/video ocean waves at sunset, 5 seconds',
    ],
    accent: 'from-violet-500 to-indigo-600',
    glyph: '🎬',
    actionable: true,
  },
  {
    id: 'seedance-25-openapi',
    name: 'Seedance 2.5 OpenAPI',
    tagline: 'Programmatic video API',
    description:
      'Reference skill for the Seedance 2.5 OpenAPI spec — call video generation programmatically with task creation + async polling. Use it via the /video command (same backend).',
    sourceFile: 'Seedance 25 Openapi Skill.md',
    category: 'developer',
    command: '/video',
    usage: '/video <your prompt>',
    examples: [
      '/video timelapse of a city skyline',
    ],
    accent: 'from-sky-500 to-cyan-600',
    glyph: '🔌',
    actionable: true,
  },
]

/** All skills are enabled by default (the user asked to enable them). */
export const DEFAULT_ENABLED: Record<string, boolean> = SKILLS.reduce(
  (acc, s) => {
    acc[s.id] = true
    return acc
  },
  {} as Record<string, boolean>
)

const STORAGE_KEY = 'uc.skills.enabled.v1'

/** Read the enabled-state map from localStorage (client-side). */
export function loadEnabledSkills(): Record<string, boolean> {
  if (typeof window === 'undefined') return { ...DEFAULT_ENABLED }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_ENABLED }
    const parsed = JSON.parse(raw)
    // merge with defaults so newly-added skills come online enabled
    return { ...DEFAULT_ENABLED, ...parsed }
  } catch {
    return { ...DEFAULT_ENABLED }
  }
}

/** Persist the enabled-state map (client-side). */
export function saveEnabledSkills(map: Record<string, boolean>) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* ignore */
  }
}

/** A skill is invokable iff it's actionable AND enabled. */
export function isSkillAvailable(
  skill: SkillDef,
  enabled: Record<string, boolean>
) {
  return Boolean(skill.actionable && enabled[skill.id])
}
