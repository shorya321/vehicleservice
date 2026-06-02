"use client"

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="relative flex h-11 w-11 items-center justify-center rounded-md border border-[var(--graphite)] bg-transparent transition-colors duration-200 hover:border-[var(--gold)] hover:bg-[var(--charcoal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]"
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 text-[var(--text-secondary)] hidden dark:block" />
      <Moon className="h-4 w-4 text-[var(--text-secondary)] block dark:hidden" />
    </button>
  )
}
