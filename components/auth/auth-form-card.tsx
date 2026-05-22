"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, useReducedMotion } from "motion/react"
import { Eye, EyeOff, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { userLogin } from "@/app/(auth)/login/actions"
import { registerUser } from "@/app/(auth)/register/actions"
import { inputClass, fieldLabelClass } from "./auth-classes"

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
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  const [registerData, setRegisterData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccessMessage(
        "Account created. Check your inbox for a confirmation email, then sign in."
      )
    }
  }, [searchParams])

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab)
    setError(null)
    setSuccessMessage(null)
    router.replace(`/${tab}`, { scroll: false })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await userLogin(loginEmail, loginPassword)

      if (result?.error) {
        setError(result.error)
        setLoading(false)
      } else if (result?.success && result?.role) {
        const raw = searchParams.get("redirect")
        const redirectUrl = raw?.startsWith("/") && !raw.startsWith("//") ? raw : null
        switch (result.role) {
          case "customer":
            router.push(redirectUrl || "/account")
            router.refresh()
            break
          case "vendor":
            router.push(redirectUrl || "/vendor/dashboard")
            router.refresh()
            break
          default:
            setError("Your account type isn't supported here. Contact support for help.")
            setLoading(false)
        }
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("We couldn't sign you in. Check your connection and try again.")
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (registerData.password !== registerData.confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (registerData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }
    if (!termsAccepted) {
      setError("Please accept the Terms of Service and Privacy Policy")
      return
    }

    setLoading(true)

    try {
      const result = await registerUser({
        full_name: registerData.full_name,
        email: registerData.email,
        password: registerData.password,
        phone: registerData.phone,
      })

      if (result?.error) {
        setError(result.error)
        setLoading(false)
      } else if (result?.success) {
        router.push("/login?registered=true")
      }
    } catch (err) {
      console.error("Registration error:", err)
      setError("We couldn't create your account. Check your connection and try again.")
      setLoading(false)
    }
  }

  const handleRegisterInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value,
    })
  }

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

      <div className="mt-10 rounded-[8px] border border-[var(--graphite)] bg-[var(--charcoal)] p-5 sm:p-7">
        <div
          role="tablist"
          aria-label="Authentication"
          className="auth-tabs"
        >
          {TABS.map((tab) => {
            const selected = activeTab === tab.key
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={selected}
                aria-controls={`auth-panel-${tab.key}`}
                id={`auth-tab-${tab.key}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => handleTabChange(tab.key)}
                className={`auth-tab focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-rich)] ${selected ? "active" : ""}`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="mt-8 flex items-start gap-3 rounded-[4px] border border-[rgba(var(--gold-rgb),0.3)] bg-[rgba(var(--gold-rgb),0.06)] p-4 text-[0.875rem] text-[var(--text-primary)]"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" aria-hidden />
          <p className="break-words">{successMessage}</p>
        </div>
      )}

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="mt-8 flex items-start gap-3 rounded-[4px] border border-destructive/20 bg-destructive/[0.08] p-4 text-[0.875rem] text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p className="break-words">{error}</p>
        </div>
      )}

      {activeTab === "login" ? (
        <form
          id="auth-panel-login"
          role="tabpanel"
          aria-labelledby="auth-tab-login"
          onSubmit={handleLogin}
          className="flex flex-col gap-5"
        >
          <div>
            <label htmlFor="login-email" className={fieldLabelClass}>Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
              maxLength={254}
              disabled={loading}
              placeholder="you@email.com"
              className={inputClass}
            />
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label htmlFor="login-password" className={fieldLabelClass + " mb-0"}>Password</label>
              <Link
                href="/forgot-password"
                className="text-[0.8125rem] text-[var(--gold)] hover:text-[var(--gold-pale)] transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showLoginPassword ? "text" : "password"}
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                maxLength={128}
                disabled={loading}
                placeholder="••••••••"
                className={inputClass + " pr-12"}
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                aria-label={showLoginPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-warm)]"
              >
                {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary mt-3 h-[52px] w-full rounded-[4px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="h-4 w-4" aria-hidden />
              </>
            )}
          </button>

          <p className="mt-2 text-center text-[0.8125rem] text-[var(--text-muted)]">
            Need help signing in?{" "}
            <Link href="/contact" className="text-[var(--gold)] hover:text-[var(--gold-pale)] transition-colors">
              Contact support
            </Link>
          </p>
        </form>
      ) : (
        <form
          id="auth-panel-register"
          role="tabpanel"
          aria-labelledby="auth-tab-register"
          onSubmit={handleRegister}
          className="flex flex-col gap-5"
        >
          <div>
            <label htmlFor="reg-name" className={fieldLabelClass}>Full name</label>
            <input
              id="reg-name"
              type="text"
              name="full_name"
              autoComplete="name"
              value={registerData.full_name}
              onChange={handleRegisterInputChange}
              required
              maxLength={100}
              disabled={loading}
              placeholder="As on your ID"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="reg-email" className={fieldLabelClass}>Email</label>
            <input
              id="reg-email"
              type="email"
              name="email"
              autoComplete="email"
              value={registerData.email}
              onChange={handleRegisterInputChange}
              required
              maxLength={254}
              disabled={loading}
              placeholder="you@email.com"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="reg-phone" className={fieldLabelClass}>Phone</label>
            <input
              id="reg-phone"
              type="tel"
              name="phone"
              autoComplete="tel"
              value={registerData.phone}
              onChange={handleRegisterInputChange}
              required
              maxLength={20}
              disabled={loading}
              placeholder="+971 50 123 4567"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="reg-password" className={fieldLabelClass}>Password</label>
            <div className="relative">
              <input
                id="reg-password"
                type={showRegisterPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                value={registerData.password}
                onChange={handleRegisterInputChange}
                required
                minLength={8}
                maxLength={128}
                disabled={loading}
                placeholder="At least 8 characters"
                className={inputClass + " pr-12"}
              />
              <button
                type="button"
                onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-warm)]"
              >
                {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 text-[0.75rem] text-[var(--text-muted)]">
              <span className={registerData.password.length >= 8 ? "text-[var(--gold)]" : ""}>
                {registerData.password.length}
              </span>
              /8 characters
            </p>
          </div>
          <div>
            <label htmlFor="reg-confirm" className={fieldLabelClass}>Confirm password</label>
            <div className="relative">
              <input
                id="reg-confirm"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                autoComplete="new-password"
                value={registerData.confirmPassword}
                onChange={handleRegisterInputChange}
                required
                minLength={8}
                maxLength={128}
                disabled={loading}
                placeholder="Repeat your password"
                className={inputClass + " pr-12"}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-warm)]"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {registerData.confirmPassword.length > 0 && (
              <p className="mt-1 text-[0.75rem]">
                {registerData.password === registerData.confirmPassword
                  ? <span className="text-[var(--gold)]">Passwords match</span>
                  : <span className="text-destructive">Passwords don&apos;t match</span>
                }
              </p>
            )}
          </div>

          <label htmlFor="reg-terms" className="mt-1 flex items-start gap-3 cursor-pointer">
            <input
              id="reg-terms"
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 appearance-none border border-[var(--graphite)] bg-[var(--black-warm)] checked:border-[var(--gold)] checked:bg-[var(--gold)] checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22><path fill=%22%23050506%22 d=%22M6 11.4 2.6 8 4 6.6l2 2 6-6L13.4 4z%22/></svg>')] bg-center bg-no-repeat focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-rich)]"
            />
            <span className="text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">
              I agree to the{" "}
              <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] hover:text-[var(--gold-pale)] transition-colors">
                Terms
              </Link>
              {" "}and{" "}
              <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] hover:text-[var(--gold-pale)] transition-colors">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary mt-3 h-[52px] w-full rounded-[4px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account
              </>
            ) : (
              <>
                Create account
                <ArrowRight className="h-4 w-4" aria-hidden />
              </>
            )}
          </button>

          <p className="mt-2 text-center text-[0.8125rem] text-[var(--text-muted)]">
            You can also book without an account.{" "}
            <Link href="/" className="text-[var(--gold)] hover:text-[var(--gold-pale)] transition-colors">
              Start a booking
            </Link>
          </p>
        </form>
      )}
      </div>
    </motion.div>
  )
}
