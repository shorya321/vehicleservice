"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "motion/react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import {
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle
} from "lucide-react"
import Link from "next/link"
import { userLogin } from "@/app/(auth)/login/actions"
import { registerUser } from "@/app/(auth)/register/actions"

interface AuthFormCardProps {
  initialTab: "login" | "register"
}

export function AuthFormCard({ initialTab }: AuthFormCardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(initialTab)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Login form state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Register form state
  const [registerData, setRegisterData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  })
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Check for success message from registration
  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccessMessage("Account created successfully! Please check your email to verify your account, then sign in.")
    }
  }, [searchParams])

  // Sync tab with URL
  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "login" | "register")
    setError(null)
    setSuccessMessage(null)
    router.replace(`/${tab}`, { scroll: false })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await userLogin(loginEmail, loginPassword)

      if (result?.error) {
        setError(result.error)
        setLoading(false)
      } else if (result?.success && result?.role) {
        const redirectUrl = searchParams.get("redirect")

        switch (result.role) {
          case "customer":
            router.push(redirectUrl || "/account")
            router.refresh()
            break
          case "vendor":
            router.push(redirectUrl || "/vendor/dashboard")
            router.refresh()
            break
          default:
            setError("Invalid user role")
            setLoading(false)
        }
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (registerData.password !== registerData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (registerData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    if (!termsAccepted) {
      setError("Please accept the Terms of Service and Privacy Policy")
      return
    }

    setLoading(true)

    try {
      const result = await registerUser({
        full_name: registerData.full_name,
        email: registerData.email,
        password: registerData.password,
        phone: registerData.phone
      })

      if (result?.error) {
        setError(result.error)
        setLoading(false)
      } else if (result?.success) {
        router.push("/login?registered=true")
      }
    } catch (err) {
      console.error("Registration error:", err)
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  const handleRegisterInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <motion.div
      className="auth-card auth-card-luxury"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="auth-card-inner relative z-10">
        {/* Card Header */}
        <div className="text-center mb-8">
          <div className="auth-icon w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-gradient-to-br from-[rgba(198,170,136,0.15)] to-[rgba(198,170,136,0.05)] border border-[rgba(198,170,136,0.25)] rounded-2xl">
            <User className="w-7 h-7 stroke-[var(--gold)]" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-2xl font-normal text-[var(--text-primary)] mb-2">
            {activeTab === "login" ? "Account Access" : "Get Started"}
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            {activeTab === "login"
              ? "Sign in or create a new account"
              : "Enter your details to create your account"}
          </p>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-8">
          <TabsList className="auth-tabs w-full grid grid-cols-2 gap-1 p-1 bg-[rgba(42,40,38,0.5)] border border-[rgba(198,170,136,0.1)] rounded-xl h-auto">
            <TabsTrigger
              value="login"
              className="checkout-auth-tab w-full py-3 px-6 text-[0.8125rem] font-medium tracking-wider uppercase rounded-lg data-[state=inactive]:text-[var(--text-muted)] data-[state=inactive]:bg-transparent transition-all"
            >
              Login
            </TabsTrigger>
            <TabsTrigger
              value="register"
              className="checkout-auth-tab w-full py-3 px-6 text-[0.8125rem] font-medium tracking-wider uppercase rounded-lg data-[state=inactive]:text-[var(--text-muted)] data-[state=inactive]:bg-transparent transition-all"
            >
              Register
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert className="border-[var(--gold)]/30 bg-[var(--gold)]/10 backdrop-blur-sm">
              <CheckCircle className="h-4 w-4 text-[var(--gold)]" />
              <AlertDescription className="text-[var(--text-primary)]">
                {successMessage}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert variant="destructive" className="bg-red-950/50 border-red-900/50">
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Login Form */}
        {activeTab === "login" && (
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="form-input-wrapper">
                <Input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                  disabled={loading}
                  className="luxury-input has-icon h-14"
                />
                <Mail className="form-input-icon" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="form-input-wrapper">
                <Input
                  type={showLoginPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  className="luxury-input has-icon h-14 pr-12"
                />
                <Lock className="form-input-icon" />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="password-toggle"
                  aria-label="Toggle password visibility"
                >
                  {showLoginPassword ? (
                    <EyeOff className="w-[18px] h-[18px]" />
                  ) : (
                    <Eye className="w-[18px] h-[18px]" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  className="border-[rgba(198,170,136,0.3)] data-[state=checked]:bg-[var(--gold)] data-[state=checked]:border-[var(--gold)]"
                />
                <span className="text-[0.8125rem] text-[var(--text-secondary)]">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-[0.8125rem] text-[var(--gold)] hover:text-[var(--gold-light)] transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full h-14 text-[0.8125rem] font-semibold tracking-wider uppercase"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 w-[18px] h-[18px]" />
                </>
              )}
            </Button>
          </form>
        )}

        {/* Register Form */}
        {activeTab === "register" && (
          <form onSubmit={handleRegister} className="flex flex-col gap-5">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="form-input-wrapper">
                <Input
                  type="text"
                  name="full_name"
                  value={registerData.full_name}
                  onChange={handleRegisterInputChange}
                  placeholder="John Doe"
                  required
                  disabled={loading}
                  className="luxury-input has-icon h-14"
                />
                <User className="form-input-icon" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="form-input-wrapper">
                <Input
                  type="email"
                  name="email"
                  value={registerData.email}
                  onChange={handleRegisterInputChange}
                  placeholder="john@example.com"
                  required
                  disabled={loading}
                  className="luxury-input has-icon h-14"
                />
                <Mail className="form-input-icon" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div className="form-input-wrapper">
                <Input
                  type="tel"
                  name="phone"
                  value={registerData.phone}
                  onChange={handleRegisterInputChange}
                  placeholder="+971 50 123 4567"
                  required
                  disabled={loading}
                  className="luxury-input has-icon h-14"
                />
                <Phone className="form-input-icon" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="form-input-wrapper">
                <Input
                  type={showRegisterPassword ? "text" : "password"}
                  name="password"
                  value={registerData.password}
                  onChange={handleRegisterInputChange}
                  placeholder="Create a password"
                  required
                  minLength={6}
                  disabled={loading}
                  className="luxury-input has-icon h-14 pr-12"
                />
                <Lock className="form-input-icon" />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  className="password-toggle"
                  aria-label="Toggle password visibility"
                >
                  {showRegisterPassword ? (
                    <EyeOff className="w-[18px] h-[18px]" />
                  ) : (
                    <Eye className="w-[18px] h-[18px]" />
                  )}
                </button>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1 pl-2">Minimum 6 characters</p>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="form-input-wrapper">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={registerData.confirmPassword}
                  onChange={handleRegisterInputChange}
                  placeholder="Confirm your password"
                  required
                  minLength={6}
                  disabled={loading}
                  className="luxury-input has-icon h-14 pr-12"
                />
                <Lock className="form-input-icon" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="password-toggle"
                  aria-label="Toggle password visibility"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-[18px] h-[18px]" />
                  ) : (
                    <Eye className="w-[18px] h-[18px]" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                className="mt-0.5 border-[rgba(198,170,136,0.3)] data-[state=checked]:bg-[var(--gold)] data-[state=checked]:border-[var(--gold)]"
              />
              <label htmlFor="terms" className="text-[0.8125rem] text-[var(--text-secondary)] leading-relaxed cursor-pointer">
                I agree to the{" "}
                <Link href="/terms" className="text-[var(--gold)] hover:text-[var(--gold-light)]">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-[var(--gold)] hover:text-[var(--gold-light)]">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full h-14 text-[0.8125rem] font-semibold tracking-wider uppercase"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2 w-[18px] h-[18px]" />
                </>
              )}
            </Button>
          </form>
        )}

      </div>
    </motion.div>
  )
}
