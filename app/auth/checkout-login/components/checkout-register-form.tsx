'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, Lock, Mail, Phone, User } from 'lucide-react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import Link from 'next/link'
import { registerAndAutoVerify } from '../actions'
import { isValidPhone, sanitizePhoneInput } from '@/lib/validation/phone'
import { checkboxClass } from '@/components/auth/auth-classes'
import { CustomerField, CustomerPasswordField } from '@/components/auth/customer-field'
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
      className="cauth-form"
      {...fadeSlide}
    >
      <div className="cauth-row-2">
        <CustomerField
          id="co-first-name"
          label="First name"
          icon={User}
          type="text"
          autoComplete="given-name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          maxLength={50}
          disabled={loading}
          placeholder="First name"
        />
        <CustomerField
          id="co-last-name"
          label="Last name"
          icon={User}
          type="text"
          autoComplete="family-name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          maxLength={50}
          disabled={loading}
          placeholder="Last name"
        />
      </div>
      <CustomerField
        id="co-reg-email"
        label="Email"
        icon={Mail}
        type="email"
        autoComplete="email"
        value={registerEmail}
        onChange={(e) => setRegisterEmail(e.target.value)}
        required
        maxLength={254}
        disabled={loading}
        placeholder="you@email.com"
      />
      <CustomerField
        id="co-phone"
        label="Phone"
        optional
        icon={Phone}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={phone}
        onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))}
        maxLength={20}
        disabled={loading}
        placeholder="+971 50 123 4567"
        aria-describedby="co-phone-hint"
        hint={
          <p id="co-phone-hint" className="cauth-hint">
            The chauffeur calls this number on arrival. You can also add it on the next step.
          </p>
        }
      />
      <CustomerPasswordField
        id="co-reg-password"
        label="Password"
        icon={Lock}
        value={registerPassword}
        onChange={setRegisterPassword}
        autoComplete="new-password"
        disabled={loading}
        placeholder="At least 8 characters"
        ariaDescribedBy="co-reg-password-hint"
        minLength={8}
        labelAside={
          <span id="co-reg-password-hint" className={`cauth-count${registerPassword.length >= 8 ? ' cauth-count--ok' : ''}`}>
            {registerPassword.length}/8<span className="sr-only"> characters</span>
          </span>
        }
      />
      <CustomerPasswordField
        id="co-reg-confirm"
        label="Confirm password"
        icon={Lock}
        value={confirmPassword}
        onChange={setConfirmPassword}
        autoComplete="new-password"
        disabled={loading}
        placeholder="Repeat your password"
        minLength={8}
        hint={
          confirmPassword.length > 0 ? (
            <p className="cauth-hint">
              {registerPassword === confirmPassword
                ? <span className="text-[var(--gold-text)]">Passwords match</span>
                : <span className="text-destructive">Passwords don&apos;t match</span>
              }
            </p>
          ) : undefined
        }
      />

      <label htmlFor="co-reg-terms" className="cauth-check">
        <input
          id="co-reg-terms"
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className={checkboxClass}
        />
        <span>
          I agree to the{" "}
          <Link href="/terms" target="_blank" rel="noopener noreferrer" className="cauth-link">
            Terms
          </Link>
          {" "}and{" "}
          <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="cauth-link">
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="cauth-submit"
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
    </motion.form>
  )
}
