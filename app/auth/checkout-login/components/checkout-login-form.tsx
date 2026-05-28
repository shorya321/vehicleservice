'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, Loader2 } from 'lucide-react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import Link from 'next/link'
import { inputClass, fieldLabelClass } from '@/components/auth/auth-classes'
import { PasswordField } from '@/components/auth/password-field'
import { fadeSlide } from '@/lib/auth/motion'

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
      className="mt-6 flex flex-col gap-6"
      {...fadeSlide}
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
            className="auth-body-sm auth-text-link"
          >
            Forgot password?
          </Link>
        </div>
        <PasswordField
          id="co-login-password"
          value={loginPassword}
          onChange={setLoginPassword}
          autoComplete="current-password"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary mt-5 h-[52px] w-full rounded-[4px]"
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
