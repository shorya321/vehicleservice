'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, Loader2, Lock, Mail } from 'lucide-react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import Link from 'next/link'
import { CustomerField, CustomerPasswordField } from '@/components/auth/customer-field'
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
      className="cauth-form"
      {...fadeSlide}
    >
      <CustomerField
        id="co-login-email"
        label="Email"
        icon={Mail}
        type="email"
        autoComplete="email"
        value={loginEmail}
        onChange={(e) => setLoginEmail(e.target.value)}
        required
        maxLength={254}
        disabled={loading}
        placeholder="you@email.com"
      />
      <CustomerPasswordField
        id="co-login-password"
        label="Password"
        icon={Lock}
        labelAside={
          <Link href="/forgot-password" className="cauth-link cauth-link--small">
            Forgot password?
          </Link>
        }
        value={loginPassword}
        onChange={setLoginPassword}
        autoComplete="current-password"
        disabled={loading}
        placeholder="Your password"
      />

      <button
        type="submit"
        disabled={loading}
        className="cauth-submit"
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
