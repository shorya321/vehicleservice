"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { AuthMessages } from "./auth-messages"
import { LoginForm } from "./login-form"
import { RegisterForm } from "./register-form"
import { LogIn, UserPlus, type LucideIcon } from "lucide-react"
import { fadeEntrance } from "@/lib/auth/motion"
import { CustomerAuthIntro, CustomerAuthTrust } from "./customer-auth-intro"

interface AuthFormCardProps {
  initialTab: "login" | "register"
}

type TabKey = "login" | "register"

const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "login", label: "Sign in", icon: LogIn },
  { key: "register", label: "Create account", icon: UserPlus },
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
    // Login form handles its own redirect
  }, [])

  return (
    <motion.div {...fadeEntrance(reduceMotion)}>
      <CustomerAuthIntro screen={activeTab} />

      <div
        role="tablist"
        aria-label="Authentication"
        className="cauth-pills"
      >
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
              aria-controls={`auth-panel-${tab.key}`}
              id={`auth-tab-${tab.key}`}
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
            <AuthMessages successMessage={successMessage} error={error} />
          </div>

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

        <div className="cauth-tear" aria-hidden="true" />
        <p className="cauth-card-foot">
          {activeTab === "login" ? "New to Infinia?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="cauth-link"
            onClick={() => handleTabChange(activeTab === "login" ? "register" : "login")}
          >
            {activeTab === "login" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>

      <CustomerAuthTrust screen={activeTab} />
    </motion.div>
  )
}
