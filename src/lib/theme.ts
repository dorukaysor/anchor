import { useEffect, useState } from 'react'

/* ═══════════════════════════════════════════════════════════════════════════════
   Anchor — Shared Animation Config
   ═══════════════════════════════════════════════════════════════════════════════ */

/* ── Framer Motion spring presets ─────────────────────────────────────────── */
export const springs = {
  /** Snappy deceleration — modals, panels, toggles */
  snappy: { type: 'spring' as const, damping: 28, stiffness: 350 },
  /** Gentle ease — page transitions, fades */
  gentle: { type: 'spring' as const, damping: 22, stiffness: 260 },
  /** Bouncy overshoot — playful enters, FAB pulse */
  bouncy: { type: 'spring' as const, damping: 18, stiffness: 400 },
} as const

/* ── Duration presets (seconds, for framer-motion) ────────────────────────── */
export const durations = {
  fast: 0.15,
  base: 0.2,
  slow: 0.35,
} as const

/* ── Shared animation variants ────────────────────────────────────────────── */

export const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  show:    { opacity: 1 },
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
}

export const slideUp = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
  show:    { opacity: 1, y: 0 },
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: 8 },
}

export const scaleIn = {
  hidden:  { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1 },
  show:    { opacity: 1, scale: 1 },
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit:    { opacity: 0, scale: 0.97 },
}

export const slideFromRight = {
  hidden:  { x: '100%' },
  visible: { x: 0 },
  show:    { x: 0 },
  initial: { x: '100%' },
  animate: { x: 0 },
  exit:    { x: '100%' },
}

export const dropIn = {
  hidden:  { opacity: 0, y: -6, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
  show:    { opacity: 1, y: 0, scale: 1 },
  initial: { opacity: 0, y: -6, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit:    { opacity: 0, y: -6, scale: 0.97 },
}

/* ── Stagger helpers ──────────────────────────────────────────────────────── */

export const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05 },
  },
}

export const staggerItem = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0 },
}

/* ── useReducedMotion hook ────────────────────────────────────────────────── */

export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setPrefersReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return prefersReduced
}
