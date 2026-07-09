'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import Link from 'next/link'
import { registerAndAutoVerify } from '../actions'
import { isValidPhone, sanitizePhoneInput } from '@/lib/validation/phone'
import { inputClass, fieldLabelClass, checkboxClass } from '@/components/auth/auth-classes'
import { PasswordField } from '@/components/auth/password-field'
import { fadeSlide } from '@/lib/auth/motion'

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
    if (phone.trim() && !isValidPhone(phone)) {
      onError('Enter a valid phone number, or leave it blank')
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
      className="mt-6 flex flex-col gap-6"
      {...fadeSlide}
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
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))}
          maxLength={20}
          disabled={loading}
          placeholder="+971 50 123 4567"
          className={inputClass}
        />
        <p className="mt-1 auth-hint">
          Optional. Can be added during checkout.
        </p>
      </div>

      <PasswordField
        id="co-reg-password"
        label="Password"
        value={registerPassword}
        onChange={setRegisterPassword}
        autoComplete="new-password"
        disabled={loading}
        placeholder="At least 8 characters"
        ariaDescribedBy="co-reg-password-hint"
        minLength={8}
        hint={
          <p id="co-reg-password-hint" className="mt-1 auth-hint">
            <span className={`numeric ${registerPassword.length >= 8 ? 'text-[var(--gold-text)]' : ''}`}>
              {registerPassword.length}
            </span>
            <span className="numeric">/8</span> characters
          </p>
        }
      />

      <PasswordField
        id="co-reg-confirm"
        label="Confirm password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        autoComplete="new-password"
        disabled={loading}
        placeholder="Repeat your password"
        minLength={8}
        hint={
          confirmPassword.length > 0 ? (
            <p className="mt-1 auth-hint">
              {registerPassword === confirmPassword
                ? <span className="text-[var(--gold-text)]">Passwords match</span>
                : <span className="text-destructive">Passwords don&apos;t match</span>
              }
            </p>
          ) : undefined
        }
      />

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary mt-5 h-[52px] w-full rounded-[4px]"
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
          className={checkboxClass}
        />
        <span className="auth-body-sm leading-relaxed text-[var(--text-secondary)]">
          I agree to the{" "}
          <Link href="/terms" target="_blank" rel="noopener noreferrer" className="auth-text-link">
            Terms
          </Link>
          {" "}and{" "}
          <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="auth-text-link">
            Privacy Policy
          </Link>
          .
        </span>
      </label>
    </motion.form>
  )
}
