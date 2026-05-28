export const AUTH_EASE = [0.16, 1, 0.3, 1] as [number, number, number, number]

export const fadeSlide = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2, ease: AUTH_EASE },
} as const

export const fadeAlert = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2, ease: AUTH_EASE },
} as const

export function fadeEntrance(reduceMotion: boolean | null) {
  if (reduceMotion) return {}
  return {
    initial: { opacity: 0, y: 16 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { duration: 0.6, ease: AUTH_EASE },
  }
}

export function fadeUp(delay = 0, reduceMotion: boolean | null = false) {
  if (reduceMotion) return {}
  return {
    initial: { opacity: 0, y: delay > 0 ? 24 : 16 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { duration: delay > 0 ? 0.8 : 0.7, delay, ease: AUTH_EASE },
  }
}
