'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { toast } from 'sonner'
import { registerAndAutoVerify } from '../actions'
import { inputClass, fieldLabelClass } from '@/components/auth/auth-styles'

interface CheckoutAuthFormProps {
  returnUrl: string
}

type TabKey = 'login' | 'register'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'login', label: 'Sign in' },
  { key: 'register', label: 'Create account' },
]

export function CheckoutAuthForm({ returnUrl }: CheckoutAuthFormProps) {
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()
  const [activeTab, setActiveTab] = useState<TabKey>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [loginFieldErrors, setLoginFieldErrors] = useState<Record<string, string>>({})

  // Register form state
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [registerFieldErrors, setRegisterFieldErrors] = useState<Record<string, string>>({})

  // Inline validation helpers
  const validateEmail = useCallback((email: string): string | null => {
    if (!email) return null
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) ? null : 'Please enter a valid email address'
  }, [])

  const validatePassword = useCallback((password: string): string | null => {
    if (!password) return null
    return password.length < 8 ? 'Password must be at least 8 characters' : null
  }, [])

  const handleLoginBlur = useCallback((field: string, value: string) => {
    let fieldError: string | null = null
    if (field === 'email') fieldError = validateEmail(value)
    if (field === 'password') fieldError = validatePassword(value)

    setLoginFieldErrors(prev => {
      if (fieldError) return { ...prev, [field]: fieldError }
      const { [field]: _, ...rest } = prev
      return rest
    })
  }, [validateEmail, validatePassword])

  const handleRegisterBlur = useCallback((field: string, value: string) => {
    let fieldError: string | null = null
    if (field === 'email') fieldError = validateEmail(value)
    if (field === 'password') fieldError = validatePassword(value)

    setRegisterFieldErrors(prev => {
      if (fieldError) return { ...prev, [field]: fieldError }
      const { [field]: _, ...rest } = prev
      return rest
    })
  }, [validateEmail, validatePassword])

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab)
    setError(null)
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.user) {
        toast.success('Logged in successfully!')
        router.push(decodeURIComponent(returnUrl))
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (registerPassword.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      const result = await registerAndAutoVerify({
        email: registerEmail,
        password: registerPassword,
        fullName: fullName,
        phone: phone
      })

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.success) {
        toast.success('Account created successfully!')
        router.push(decodeURIComponent(returnUrl))
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="rounded-[8px] border border-[var(--auth-card-border)] bg-[var(--auth-card-bg)] p-5 sm:p-7">
        {/* Tabs */}
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
                aria-controls={`checkout-panel-${tab.key}`}
                id={`checkout-tab-${tab.key}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => handleTabChange(tab.key)}
                className={`auth-tab focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--auth-card-bg)] ${selected ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mt-6 flex items-start gap-3 rounded-[4px] border border-[var(--auth-error-border)] bg-[var(--auth-error-bg)] p-4 text-[0.875rem] text-[var(--auth-error-text)]"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>{error}</p>
          </div>
        )}

        {/* Login Tab */}
        {activeTab === 'login' ? (
          <form
            id="checkout-panel-login"
            role="tabpanel"
            aria-labelledby="checkout-tab-login"
            onSubmit={handleLogin}
            className="flex flex-col gap-4"
          >
            <div>
              <label htmlFor="login-email" className={fieldLabelClass}>Email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="john@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                onBlur={(e) => handleLoginBlur('email', e.target.value)}
                required
                disabled={loading}
                className={inputClass}
                aria-invalid={!!loginFieldErrors.email}
                aria-describedby={loginFieldErrors.email ? 'login-email-error' : undefined}
              />
              {loginFieldErrors.email && (
                <p id="login-email-error" className="text-xs text-[var(--auth-error-text)] mt-1">{loginFieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="login-password" className={fieldLabelClass}>Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showLoginPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onBlur={(e) => handleLoginBlur('password', e.target.value)}
                  required
                  disabled={loading}
                  className={inputClass + ' pr-12'}
                  aria-invalid={!!loginFieldErrors.password}
                  aria-describedby={loginFieldErrors.password ? 'checkout-login-password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center text-[var(--text-muted)] hover:text-[var(--gold)] focus-visible:outline-none focus-visible:text-[var(--gold)]"
                >
                  {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {loginFieldErrors.password && (
                <p id="checkout-login-password-error" className="text-xs text-[var(--auth-error-text)] mt-1">{loginFieldErrors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-end">
              <a
                href="/auth/forgot-password"
                className="text-[0.75rem] uppercase tracking-[0.16em] text-[var(--gold-text)] visited:text-[var(--gold-text)] hover:text-[var(--gold-text-hover)] transition-colors"
                aria-label="Reset your password"
              >
                Forgot
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary mt-3 h-[52px] w-full rounded-[4px] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Signing in
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Register Tab */
          <form
            id="checkout-panel-register"
            role="tabpanel"
            aria-labelledby="checkout-tab-register"
            onSubmit={handleRegister}
            className="flex flex-col gap-4"
          >
            <div>
              <label htmlFor="checkout-full-name" className={fieldLabelClass}>Full name</label>
              <input
                id="checkout-full-name"
                type="text"
                autoComplete="name"
                placeholder="As on your ID"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="register-email" className={fieldLabelClass}>Email</label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                placeholder="john@example.com"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                onBlur={(e) => handleRegisterBlur('email', e.target.value)}
                required
                disabled={loading}
                className={inputClass}
                aria-invalid={!!registerFieldErrors.email}
                aria-describedby={registerFieldErrors.email ? 'register-email-error' : undefined}
              />
              {registerFieldErrors.email && (
                <p id="register-email-error" className="text-xs text-[var(--auth-error-text)] mt-1">{registerFieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className={fieldLabelClass}>Phone Number</label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+1 234 567 8900"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                className={inputClass}
              />
              <p className="text-[0.6875rem] text-[var(--text-muted)] mt-1.5">Optional - can be added during checkout</p>
            </div>

            <div>
              <label htmlFor="register-password" className={fieldLabelClass}>Password</label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showRegisterPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Create a password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  onBlur={(e) => handleRegisterBlur('password', e.target.value)}
                  required
                  disabled={loading}
                  className={inputClass + ' pr-12'}
                  aria-invalid={!!registerFieldErrors.password}
                  aria-describedby={`register-password-hint${registerFieldErrors.password ? ' register-password-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center text-[var(--text-muted)] hover:text-[var(--gold)] focus-visible:outline-none focus-visible:text-[var(--gold)]"
                >
                  {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p id="register-password-hint" className="text-[0.6875rem] text-[var(--text-muted)] mt-1.5">
                Minimum 8 characters
              </p>
              {registerFieldErrors.password && (
                <p id="register-password-error" className="text-xs text-[var(--auth-error-text)] mt-1">{registerFieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary mt-3 h-[52px] w-full rounded-[4px] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Creating account
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>

            <p className="mt-2 text-center text-[0.8125rem] text-[var(--text-muted)]">
              By creating an account, you agree to our{' '}
              <a href="/terms" className="text-[var(--gold-text)] visited:text-[var(--gold-text)] hover:text-[var(--gold-text-hover)] transition-colors">
                Terms of Service
              </a>
              {' '}and{' '}
              <a href="/privacy" className="text-[var(--gold-text)] visited:text-[var(--gold-text)] hover:text-[var(--gold-text-hover)] transition-colors">
                Privacy Policy
              </a>
            </p>
          </form>
        )}
      </div>
    </motion.div>
  )
}
