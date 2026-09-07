"use client"

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

interface ThemeToggleProps {
  /**
   * 'default' keeps the 44px touch target used on the auth screens.
   * 'sm' is the 40px desktop control the public header shares with the
   * currency selector, avatar and CTA so the cluster sits on one baseline.
   */
  size?: 'default' | 'sm'
}

export function ThemeToggle({ size = 'default' }: ThemeToggleProps = {}) {
  const { setTheme, resolvedTheme } = useTheme()

  const sizing =
    size === 'sm' ? 'h-11 w-11 rounded-lg lg:h-10 lg:w-10' : 'h-11 w-11 rounded-md'

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className={`relative flex ${sizing} items-center justify-center border border-[var(--graphite)] bg-transparent transition-colors duration-200 hover:border-[var(--gold)] hover:bg-[var(--charcoal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]`}
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 text-[var(--text-secondary)] hidden dark:block" />
      <Moon className="h-4 w-4 text-[var(--text-secondary)] block dark:hidden" />
    </button>
  )
}
