"use client"

import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  if (!mounted) {
    return (
      <button
        className="relative h-11 w-11 rounded-md border border-neutral-300 bg-transparent dark:border-neutral-600"
        aria-label="Toggle theme"
      />
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative flex h-11 w-11 items-center justify-center rounded-md border border-[var(--graphite)] bg-transparent transition-colors duration-200 hover:border-[var(--gold)] hover:bg-[var(--charcoal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-[var(--text-secondary)]" />
      ) : (
        <Moon className="h-4 w-4 text-[var(--text-secondary)]" />
      )}
    </button>
  )
}
