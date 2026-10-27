'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { Check } from 'lucide-react'
import Link from 'next/link'
import { AuthMessages } from '@/components/auth/auth-messages'
import { CheckoutLoginForm } from './checkout-login-form'
import { CheckoutRegisterForm } from './checkout-register-form'
import { fadeEntrance } from '@/lib/auth/motion'
import { CHECKOUT_TRUST } from './checkout-trust'

interface CheckoutAuthFormProps {
  returnUrl: string
  /** Show the three promises under the card. Off when the booking ticket already lists them. */
  showTrust?: boolean
}

type TabKey = 'login' | 'register'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'login', label: 'Sign in' },
  { key: 'register', label: 'Sign up' },
]

const INTRO: Record<TabKey, { title: string; body: string }> = {
  login: {
    title: 'Sign in to finish your booking.',
    body: 'You come straight back to this transfer with your name and phone filled in.',
  },
  register: {
    title: 'Create an account to book.',
    body: 'One minute, then straight back to this transfer to add passenger details and pay.',
  },
}

export function CheckoutAuthForm({ returnUrl, showTrust = false }: CheckoutAuthFormProps) {
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
      <h1 className="editorial-section-title ckl-title">{intro.title}</h1>
      <p className="ckl-lede">{intro.body}</p>

      <div className="cauth-card ckl-card">
        <div role="tablist" aria-label="Authentication" className="ckl-seg">
          {TABS.map((tab, i) => {
            const selected = activeTab === tab.key
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
              >
                {tab.label}
              </button>
            )
          })}
        </div>

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
      </div>

      {showTrust && (
        <ul className="ckl-trust">
          {CHECKOUT_TRUST.map((item) => (
            <li key={item}>
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      )}

      <p className="ckl-help">
        Need help? <Link href="/contact" className="cauth-link">Contact support</Link>
      </p>
    </motion.div>
  )
}
