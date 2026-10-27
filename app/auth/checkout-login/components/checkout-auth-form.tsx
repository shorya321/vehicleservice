'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { ArrowLeft, LogIn, UserPlus, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { AuthMessages } from '@/components/auth/auth-messages'
import { CheckoutLoginForm } from './checkout-login-form'
import { CheckoutRegisterForm } from './checkout-register-form'
import { fadeEntrance } from '@/lib/auth/motion'

interface CheckoutAuthFormProps {
  returnUrl: string
  /** Compact booking ticket, shown under the heading below the desktop breakpoint. */
  summary?: React.ReactNode
}

type TabKey = 'login' | 'register'

const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: 'login', label: 'Sign in', icon: LogIn },
  { key: 'register', label: 'Create account', icon: UserPlus },
]

const INTRO: Record<TabKey, { accent: string; title: string; body: string }> = {
  login: {
    accent: 'Step before payment',
    title: 'Continue your booking.',
    body: 'Sign in and you come straight back to this transfer, with your name and phone filled in.',
  },
  register: {
    accent: 'Free account',
    title: 'Create an account to book.',
    body: 'It takes a minute. You come straight back to this transfer to add passenger details and pay.',
  },
}

const TRUST = ['Fixed fare at booking', 'Free cancellation 24h+', 'Flights tracked']

export function CheckoutAuthForm({ returnUrl, summary }: CheckoutAuthFormProps) {
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

  const intro = INTRO[activeTab]

  return (
    <motion.div {...fadeEntrance(reduceMotion)}>
      <p className="cauth-eyebrow">
        Secure checkout<span> · {intro.accent}</span>
      </p>
      <h1 className="cauth-title">{intro.title}</h1>
      <p className="cauth-summary">{intro.body}</p>

      {summary}

      <div role="tablist" aria-label="Authentication" className="cauth-pills">
        {TABS.map((tab, i) => {
          const selected = activeTab === tab.key
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              ref={(el) => { tabRefs.current[i] = el }}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`checkout-panel-${tab.key}`}
              id={`checkout-tab-${tab.key}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => handleTabChange(tab.key)}
              onKeyDown={(e) => handleTabKeyDown(e, i)}
              className="cauth-pill"
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="cauth-card">
        <div className="cauth-card-body">
          <div className="cauth-messages">
            <AuthMessages successMessage={null} error={error} />
          </div>

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

        <div className="cauth-tear" aria-hidden="true" />
        <p className="cauth-card-foot">
          {activeTab === 'login' ? 'New to Infinia?' : 'Already have an account?'}{' '}
          <button
            type="button"
            className="cauth-link"
            onClick={() => handleTabChange(activeTab === 'login' ? 'register' : 'login')}
          >
            {activeTab === 'login' ? 'Create an account' : 'Sign in'}
          </button>
        </p>
      </div>

      <ul className="cauth-trust">
        {TRUST.map((item) => <li key={item}>{item}</li>)}
      </ul>

      <div className="ckl-links">
        <Link href="/" className="cauth-back">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to search
        </Link>
        <p className="cauth-help">
          Need help? <Link href="/contact" className="cauth-link">Contact support</Link>
        </p>
      </div>
    </motion.div>
  )
}
