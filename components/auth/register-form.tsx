"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { registerUser } from "@/app/(auth)/register/actions"
import { inputClass, fieldLabelClass, passwordToggleClass } from "./auth-classes"

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
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
      className="mt-6 flex flex-col gap-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
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
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={20}
          disabled={loading}
          placeholder="+971 50 123 4567"
          aria-describedby="reg-phone-hint"
          className={inputClass}
        />
        <p id="reg-phone-hint" className="mt-1 text-[0.75rem] text-[var(--text-muted)]">
          Optional. Can be added during checkout.
        </p>
      </div>
      <div>
        <label htmlFor="reg-password" className={fieldLabelClass}>Password</label>
        <div className="relative">
          <input
            id="reg-password"
            type={showRegisterPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            maxLength={128}
            disabled={loading}
            placeholder="At least 8 characters"
            aria-describedby="reg-password-hint"
            className={inputClass + " pr-12"}
          />
          <button
            type="button"
            onClick={() => setShowRegisterPassword(!showRegisterPassword)}
            aria-label={showRegisterPassword ? "Hide password" : "Show password"}
            className={passwordToggleClass}
          >
            {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p id="reg-password-hint" className="mt-1 text-[0.75rem] text-[var(--text-muted)]">
          <span className={password.length >= 8 ? "text-[var(--gold)]" : ""}>
            {password.length}
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
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            maxLength={128}
            disabled={loading}
            placeholder="Repeat your password"
            aria-describedby="reg-confirm-hint"
            className={inputClass + " pr-12"}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            className={passwordToggleClass}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {confirmPassword.length > 0 && (
          <p id="reg-confirm-hint" className="mt-1 text-[0.75rem]">
            {password === confirmPassword
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
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </>
        )}
      </button>

      <p className="mt-2 text-center text-[0.8125rem] text-[var(--text-muted)]">
        You can also book without an account.{" "}
        <Link href="/" className="text-[var(--gold)] hover:text-[var(--gold-pale)] transition-colors">
          Start a booking
        </Link>
      </p>
    </motion.form>
  )
}
