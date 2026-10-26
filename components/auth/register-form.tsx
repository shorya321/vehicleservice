"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { ArrowRight, Loader2, Lock, Mail, Phone, User } from "lucide-react"
import Link from "next/link"
import { registerUser } from "@/app/(auth)/register/actions"
import { isValidPhone, sanitizePhoneInput } from "@/lib/validation/phone"
import { checkboxClass } from "./auth-classes"
import { CustomerField, CustomerPasswordField } from "./customer-field"
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
      className="cauth-form"
      {...fadeSlide}
    >
      <div className="cauth-row-2">
        <CustomerField
          id="reg-first-name"
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
          id="reg-last-name"
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
        id="reg-email"
        label="Email"
        icon={Mail}
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        maxLength={254}
        disabled={loading}
        placeholder="you@email.com"
      />
      <CustomerField
        id="reg-phone"
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
        aria-describedby="reg-phone-hint"
        hint={
          <p id="reg-phone-hint" className="cauth-hint">
            The chauffeur calls this number on arrival. You can also add it at checkout.
          </p>
        }
      />
      <CustomerPasswordField
        id="reg-password"
        label="Password"
        icon={Lock}
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        disabled={loading}
        placeholder="At least 8 characters"
        ariaDescribedBy="reg-password-hint"
        minLength={8}
        labelAside={
          <span id="reg-password-hint" className={`cauth-count${password.length >= 8 ? " cauth-count--ok" : ""}`}>
            {password.length}/8<span className="sr-only"> characters</span>
          </span>
        }
      />
      <CustomerPasswordField
        id="reg-confirm"
        label="Confirm password"
        icon={Lock}
        value={confirmPassword}
        onChange={setConfirmPassword}
        autoComplete="new-password"
        disabled={loading}
        placeholder="Repeat your password"
        ariaDescribedBy="reg-confirm-hint"
        minLength={8}
        hint={
          confirmPassword.length > 0 ? (
            <p id="reg-confirm-hint" className="cauth-hint">
              {password === confirmPassword
                ? <span className="text-[var(--gold-text)]">Passwords match</span>
                : <span className="text-destructive">Passwords don&apos;t match</span>
              }
            </p>
          ) : undefined
        }
      />

      <label htmlFor="reg-terms" className="cauth-check">
        <input
          id="reg-terms"
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
