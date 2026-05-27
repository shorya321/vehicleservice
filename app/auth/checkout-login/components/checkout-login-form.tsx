'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import Link from 'next/link'
import { inputClass, fieldLabelClass, passwordToggleClass } from '@/components/auth/auth-classes'

interface CheckoutLoginFormProps {
  loading: boolean
  returnUrl: string
  safeReturnUrl: (url: string) => string
  onSubmitStart: () => void
  onError: (msg: string) => void
}

export function CheckoutLoginForm({
  loading,
  returnUrl,
  safeReturnUrl,
  onSubmitStart,
  onError,
}: CheckoutLoginFormProps) {
  const router = useRouter()

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  const handleLogin = async (e: React.SubmitEvent) => {
    e.preventDefault()
    onSubmitStart()

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })

      if (authError) {
        onError(authError.message)
        return
      }

      if (data.user) {
        toast.success('Signed in successfully')
        router.push(safeReturnUrl(returnUrl))
        router.refresh()
      }
    } catch {
      onError('We couldn\'t sign you in. Check your connection and try again.')
    }
  }

  return (
    <motion.form
      key="login"
      id="checkout-panel-login"
      role="tabpanel"
      aria-labelledby="checkout-tab-login"
      onSubmit={handleLogin}
      className="mt-6 flex flex-col gap-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div>
        <label htmlFor="co-login-email" className={fieldLabelClass}>Email</label>
        <input
          id="co-login-email"
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
          <label htmlFor="co-login-password" className={fieldLabelClass + ' mb-0'}>Password</label>
          <Link
            href="/forgot-password"
            className="text-[0.8125rem] text-[var(--gold)] hover:text-[var(--gold-pale)] transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            id="co-login-password"
            type={showLoginPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            required
            maxLength={128}
            disabled={loading}
            placeholder="••••••••"
            className={inputClass + ' pr-12'}
          />
          <button
            type="button"
            onClick={() => setShowLoginPassword(!showLoginPassword)}
            aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
            className={passwordToggleClass}
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
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </>
        )}
      </button>
    </motion.form>
  )
}
