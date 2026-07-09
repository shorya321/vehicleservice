"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { registerUser } from "@/app/(auth)/register/actions"
import { isValidPhone, sanitizePhoneInput } from "@/lib/validation/phone"
import { inputClass, fieldLabelClass, checkboxClass } from "./auth-classes"
import { PasswordField } from "./password-field"
import { fadeSlide } from "@/lib/auth/motion"

interface RegisterFormProps {
  loading: boolean
  onSubmitStart: () => void
  onError: (msg: string) => void
}

export function RegisterForm({ loading, onSubmitStart, onError }: RegisterFormProps) {
  const router = useRouter()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [termsAccepted, setTermsAccepted] = useState(false)

  const handleRegister = async (e: React.SubmitEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      onError("Passwords do not match")
      return
    }
    if (password.length < 8) {
      onError("Password must be at least 8 characters long")
      return
    }
    if (!termsAccepted) {
      onError("Please accept the Terms of Service and Privacy Policy")
      return
    }
    if (phone.trim() && !isValidPhone(phone)) {
      onError("Enter a valid phone number, or leave it blank")
      return
    }

    onSubmitStart()

    try {
      const result = await registerUser({
        full_name: `${firstName} ${lastName}`.trim(),
        email,
        password,
        phone,
      })

      if (result?.error) {
        onError(result.error)
      } else if (result?.success) {
        router.push("/login?registered=true")
      }
    } catch {
      onError("We couldn't create your account. Check your connection and try again.")
    }
  }

  return (
    <motion.form
      key="register"
      id="auth-panel-register"
      role="tabpanel"
      aria-labelledby="auth-tab-register"
      onSubmit={handleRegister}
      className="mt-6 flex flex-col gap-6"
      {...fadeSlide}
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="reg-first-name" className={fieldLabelClass}>First name</label>
          <input
            id="reg-first-name"
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
          <label htmlFor="reg-last-name" className={fieldLabelClass}>Last name</label>
          <input
            id="reg-last-name"
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
        <label htmlFor="reg-email" className={fieldLabelClass}>Email</label>
        <input
          id="reg-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))}
          maxLength={20}
          disabled={loading}
          placeholder="+971 50 123 4567"
          aria-describedby="reg-phone-hint"
          className={inputClass}
        />
        <p id="reg-phone-hint" className="mt-1 auth-hint">
          Optional. Can be added during checkout.
        </p>
      </div>
      <PasswordField
        id="reg-password"
        label="Password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        disabled={loading}
        placeholder="At least 8 characters"
        ariaDescribedBy="reg-password-hint"
        minLength={8}
        hint={
          <p id="reg-password-hint" className="mt-1 auth-hint">
            <span className={`numeric ${password.length >= 8 ? "text-[var(--gold-text)]" : ""}`}>
              {password.length}
            </span>
            <span className="numeric">/8</span> characters
          </p>
        }
      />
      <PasswordField
        id="reg-confirm"
        label="Confirm password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        autoComplete="new-password"
        disabled={loading}
        placeholder="Repeat your password"
        ariaDescribedBy="reg-confirm-hint"
        minLength={8}
        hint={
          confirmPassword.length > 0 ? (
            <p id="reg-confirm-hint" className="mt-1 auth-hint">
              {password === confirmPassword
                ? <span className="text-[var(--gold-text)]">Passwords match</span>
                : <span className="text-destructive">Passwords don&apos;t match</span>
              }
            </p>
          ) : undefined
        }
      />

      <label htmlFor="reg-terms" className="mt-1 flex items-start gap-3 cursor-pointer">
        <input
          id="reg-terms"
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

      <p className="mt-2 text-center auth-body-sm text-[var(--text-muted)]">
        You can also book without an account.{" "}
        <Link href="/" className="auth-text-link">
          Start a booking
        </Link>
      </p>
    </motion.form>
  )
}
