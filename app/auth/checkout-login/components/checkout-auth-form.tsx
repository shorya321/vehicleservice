'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { AuthMessages } from '@/components/auth/auth-messages'
import { CheckoutLoginForm } from './checkout-login-form'
import { CheckoutRegisterForm } from './checkout-register-form'

interface CheckoutAuthFormProps {
  returnUrl: string
}

type TabKey = 'login' | 'register'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'login', label: 'Sign in' },
  { key: 'register', label: 'Create account' },
]

export function CheckoutAuthForm({ returnUrl }: CheckoutAuthFormProps) {
  const reduceMotion = useReducedMotion()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const [activeTab, setActiveTab] = useState<TabKey>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const safeReturnUrl = useCallback((url: string) => {
    try {
      const decoded = decodeURIComponent(url)
      if (decoded.startsWith('/') && !decoded.startsWith('//')) return decoded
    } catch { /* invalid URI */ }
    return '/checkout'
  }, [])

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab)
    setError(null)
  }

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    let next = index
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      next = (index + 1) % TABS.length
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      next = (index - 1 + TABS.length) % TABS.length
    } else if (e.key === 'Home') {
      next = 0
    } else if (e.key === 'End') {
      next = TABS.length - 1
    } else {
      return
    }
    e.preventDefault()
    handleTabChange(TABS[next].key)
    tabRefs.current[next]?.focus()
  }

  const handleSubmitStart = useCallback(() => {
    setError(null)
    setLoading(true)
  }, [])

  const handleError = useCallback((msg: string) => {
    setError(msg)
    setLoading(false)
  }, [])

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="auth-card">
        <div
          role="tablist"
          aria-label="Authentication"
          className="auth-tabs"
          data-active-tab={TABS.findIndex(t => t.key === activeTab)}
        >
          {TABS.map((tab, i) => {
            const selected = activeTab === tab.key
            return (
              <button
                key={tab.key}
                ref={(el) => { tabRefs.current[i] = el }}
                role="tab"
                aria-selected={selected}
                aria-controls={`checkout-panel-${tab.key}`}
                id={`checkout-tab-${tab.key}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => handleTabChange(tab.key)}
                onKeyDown={(e) => handleTabKeyDown(e, i)}
                className={`auth-tab focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--charcoal)] ${selected ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <AuthMessages successMessage={null} error={error} />

        <AnimatePresence mode="wait">
          {activeTab === 'login' ? (
            <CheckoutLoginForm
              loading={loading}
              returnUrl={returnUrl}
              safeReturnUrl={safeReturnUrl}
              onSubmitStart={handleSubmitStart}
              onError={handleError}
            />
          ) : (
            <CheckoutRegisterForm
              loading={loading}
              returnUrl={returnUrl}
              safeReturnUrl={safeReturnUrl}
              onSubmitStart={handleSubmitStart}
              onError={handleError}
            />
          )}
        </AnimatePresence>
      </div>

      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center gap-2 text-[0.75rem] font-medium uppercase tracking-[0.16em] text-[var(--gold)] hover:text-[var(--gold-pale)] transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to search
      </Link>
    </motion.div>
  )
}
