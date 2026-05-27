'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import Link from 'next/link'
import { registerAndAutoVerify } from '../actions'
import { inputClass, fieldLabelClass, passwordToggleClass } from '@/components/auth/auth-classes'

interface CheckoutRegisterFormProps {
  loading: boolean
  returnUrl: string
  safeReturnUrl: (url: string) => string
  onSubmitStart: () => void
  onError: (msg: string) => void
}

export function CheckoutRegisterForm({
  loading,
  returnUrl,
  safeReturnUrl,
  onSubmitStart,
  onError,
}: CheckoutRegisterFormProps) {
  const router = useRouter()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const handleRegister = async (e: React.SubmitEvent) => {
    e.preventDefault()

    if (!termsAccepted) {
      onError('Please accept the Terms of Service and Privacy Policy')
      return
    }

    if (registerPassword !== confirmPassword) {
      onError('Passwords do not match')
      return
    }
    if (registerPassword.length < 8) {
      onError('Password must be at least 8 characters long')
      return
    }

    onSubmitStart()

    try {
      const result = await registerAndAutoVerify({
        email: registerEmail,
        password: registerPassword,
        firstName,
        lastName,
        phone,
      })

      if (result.error) {
        onError(result.error)
        return
      }

      if (result.success) {
        toast.success('Account created successfully')
        router.push(safeReturnUrl(returnUrl))
        router.refresh()
      }
    } catch {
      onError('We couldn\'t create your account. Check your connection and try again.')
    }
  }

  return (
    <motion.form
      key="register"
      id="checkout-panel-register"
      role="tabpanel"
      aria-labelledby="checkout-tab-register"
      onSubmit={handleRegister}
      className="mt-6 flex flex-col gap-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="co-first-name" className={fieldLabelClass}>First name</label>
          <input
            id="co-first-name"
            type="text"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            maxLength={50}
            disabled={loading}
            placeholder="First name"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="co-last-name" className={fieldLabelClass}>Last name</label>
          <input
            id="co-last-name"
            type="text"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            maxLength={50}
            disabled={loading}
            placeholder="Last name"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="co-reg-email" className={fieldLabelClass}>Email</label>
        <input
          id="co-reg-email"
          type="email"
          autoComplete="email"
          value={registerEmail}
          onChange={(e) => setRegisterEmail(e.target.value)}
          required
          maxLength={254}
          disabled={loading}
          placeholder="you@email.com"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="co-phone" className={fieldLabelClass}>Phone</label>
        <input
          id="co-phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={20}
          disabled={loading}
          placeholder="+971 50 123 4567"
          className={inputClass}
        />
        <p className="mt-1 text-[0.75rem] text-[var(--text-muted)]">
          Optional. Can be added during checkout.
        </p>
      </div>

      <div>
        <label htmlFor="co-reg-password" className={fieldLabelClass}>Password</label>
        <div className="relative">
          <input
            id="co-reg-password"
            type={showRegisterPassword ? 'text' : 'password'}
            autoComplete="new-password"
            aria-describedby="co-reg-password-hint"
            value={registerPassword}
            onChange={(e) => setRegisterPassword(e.target.value)}
            required
            minLength={8}
            maxLength={128}
            disabled={loading}
            placeholder="At least 8 characters"
            className={inputClass + ' pr-12'}
          />
          <button
            type="button"
            onClick={() => setShowRegisterPassword(!showRegisterPassword)}
            aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
            className={passwordToggleClass}
          >
            {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p id="co-reg-password-hint" className="mt-1 text-[0.75rem] text-[var(--text-muted)]">
          <span className={registerPassword.length >= 8 ? 'text-[var(--gold)]' : ''}>
            {registerPassword.length}
          </span>
          /8 characters
        </p>
      </div>

      <div>
        <label htmlFor="co-reg-confirm" className={fieldLabelClass}>Confirm password</label>
        <div className="relative">
          <input
            id="co-reg-confirm"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            maxLength={128}
            disabled={loading}
            placeholder="Repeat your password"
            className={inputClass + ' pr-12'}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            className={passwordToggleClass}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {confirmPassword.length > 0 && (
          <p className="mt-1 text-[0.75rem]">
            {registerPassword === confirmPassword
              ? <span className="text-[var(--gold)]">Passwords match</span>
              : <span className="text-destructive">Passwords don&apos;t match</span>
            }
          </p>
        )}
      </div>

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
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </>
        )}
      </button>

      <label htmlFor="co-reg-terms" className="mt-1 flex items-start gap-3 cursor-pointer">
        <input
          id="co-reg-terms"
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
    </motion.form>
  )
}
