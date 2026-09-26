'use client'
// Mehrzad ArianMehr©

import type { Transition, Variants } from 'framer-motion'

/**
 * Apple-style spring presets, translated to Framer Motion.
 * (From WWDC "Designing Fluid Interfaces": damping ratio + response.)
 *
 * - Default UI: critically damped (no overshoot), response ~0.4s
 * - Momentum interactions: slight bounce, response ~0.3-0.4s
 *
 * Framer Motion's `type: 'spring'` uses `damping` (≈ damping ratio * 100
 * roughly, but here we use the direct stiffness/damping feel) and `duration`
 * (≈ response). We use `bounce` + `duration` for the closest match.
 */

// Critically damped — graceful, no bounce. Use for everything by default.
export const springDefault: Transition = {
  type: 'spring',
  bounce: 0,
  duration: 0.4,
}

// Slight bounce — only for momentum-driven interactions (flicks, throws).
export const springMomentum: Transition = {
  type: 'spring',
  bounce: 0.2,
  duration: 0.4,
}

// Snappy, short — for small UI elements (badges, chips, toggles).
export const springSnappy: Transition = {
  type: 'spring',
  bounce: 0,
  duration: 0.3,
}

// Message entrance: subtle rise + fade, interruptible.
export const messageVariants: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.99 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springDefault,
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.15, ease: [0.2, 0.8, 0.2, 1] },
  },
}

// Suggestion card hover lift.
export const cardHover = {
  rest: { y: 0, scale: 1 },
  hover: { y: -2, scale: 1.01, transition: springSnappy },
}

// Sidebar chat item — gentle spring on layout reordering.
export const chatItemVariants: Variants = {
  hidden: { opacity: 0, x: 8 },
  visible: { opacity: 1, x: 0, transition: springDefault },
  exit: { opacity: 0, x: 8, transition: { duration: 0.15 } },
}
