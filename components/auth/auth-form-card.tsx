"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { AuthMessages } from "./auth-messages"
import { LoginForm } from "./login-form"
import { RegisterForm } from "./register-form"

interface AuthFormCardProps {
  initialTab: "login" | "register"
}

type TabKey = "login" | "register"

const TABS: { key: TabKey; label: string }[] = [
  { key: "login", label: "Sign in" },
  { key: "register", label: "Create account" },
]

export function AuthFormCard({ initialTab }: AuthFormCardProps) {
  const reduceMotion = useReducedMotion()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccessMessage(
        "Account created. Check your inbox for a confirmation email, then sign in."
      )
    }
    const msg = searchParams.get("message")
    if (msg) {
      setSuccessMessage(msg)
    }
  }, [searchParams])

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab)
    setError(null)
    setSuccessMessage(null)
    router.replace(`/${tab}`, { scroll: false })
  }, [router])

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    let next = index
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      next = (index + 1) % TABS.length
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      next = (index - 1 + TABS.length) % TABS.length
    } else if (e.key === "Home") {
      next = 0
    } else if (e.key === "End") {
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

  const handleLoginSuccess = useCallback(() => {
    // Login form handles its own redirect; nothing extra needed here
  }, [])

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="editorial-eyebrow">
        {activeTab === "login" ? "Welcome back" : "New here"}
      </div>
      <h1 className="editorial-headline mt-6">
        {activeTab === "login" ? (
          <>Sign in to your account.</>
        ) : (
          <>Create an <em>account.</em></>
        )}
      </h1>
      <p className="editorial-body mt-6 max-w-md">
        {activeTab === "login"
          ? "Enter the email you booked with. We never send marketing to this address."
          : "Used only for booking confirmations, receipts, and chauffeur contact details."}
      </p>

      <div className="mt-10 auth-card">
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
                aria-controls={`auth-panel-${tab.key}`}
                id={`auth-tab-${tab.key}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => handleTabChange(tab.key)}
                onKeyDown={(e) => handleTabKeyDown(e, i)}
                className={`auth-tab focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--charcoal)] ${selected ? "active" : ""}`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <AuthMessages successMessage={successMessage} error={error} />

        <AnimatePresence mode="wait">
          {activeTab === "login" ? (
            <LoginForm
              loading={loading}
              onSubmitStart={handleSubmitStart}
              onError={handleError}
              onSuccess={handleLoginSuccess}
            />
          ) : (
            <RegisterForm
              loading={loading}
              onSubmitStart={handleSubmitStart}
              onError={handleError}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
