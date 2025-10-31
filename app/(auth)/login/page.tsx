"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { userLogin } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Car, Loader2, CheckCircle, Mail, Lock } from "lucide-react"
import Link from "next/link"

function LoginForm() {
  const searchParams = useSearchParams()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccessMessage("Account created successfully! Please sign in to continue.")
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await userLogin(email, password)
      
      if (result?.error) {
        setError(result.error)
        setLoading(false)
      } else if (result?.success && result?.role) {
        // Successful login, redirect based on role
        console.log('Login successful for role:', result.role)
        
        switch (result.role) {
          case 'customer':
            router.push('/customer/dashboard')
            router.refresh()
            break
          case 'vendor':
            router.push('/vendor/dashboard')
            router.refresh()
            break
          case 'driver':
            // Redirect to customer dashboard for now since driver dashboard doesn't exist
            router.push('/customer/dashboard')
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-luxury-black px-4 py-12 relative overflow-hidden">
      {/* Ambient Background Animations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-luxury-gold/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-luxury-gold/5 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="luxury-card backdrop-blur-md bg-luxury-darkGray/80 border border-luxury-gold/20 rounded-lg p-8 md:p-10">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <motion.div
              className="flex items-center justify-center mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <div className="h-16 w-16 rounded-lg bg-luxury-gold/10 backdrop-blur-sm border border-luxury-gold/30 flex items-center justify-center">
                <Car className="h-9 w-9" style={{ color: "#C6AA88" }} />
              </div>
            </motion.div>
            <h1 className="font-serif text-3xl md:text-4xl text-luxury-pearl mb-2">Welcome Back</h1>
            <p className="text-luxury-lightGray text-sm">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {successMessage && (
              <Alert className="border-luxury-gold/30 bg-luxury-gold/10 backdrop-blur-sm">
                <CheckCircle className="h-4 w-4" style={{ color: "#C6AA88" }} />
                <AlertDescription className="text-luxury-pearl">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive" className="bg-red-950/50 border-red-900/50">
                <AlertDescription className="text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-luxury-lightGray">Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: "#C6AA88" }} />
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-14 pl-12 bg-luxury-black/40 border-luxury-gold/20 text-luxury-pearl placeholder:text-luxury-lightGray/50 focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-luxury-lightGray">Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: "#C6AA88" }} />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-14 pl-12 bg-luxury-black/40 border-luxury-gold/20 text-luxury-pearl placeholder:text-luxury-lightGray/50 focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 bg-luxury-gold hover:bg-luxury-gold/90 text-luxury-black font-sans uppercase tracking-wider font-semibold transition-all duration-300 active:scale-95"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="flex flex-col gap-3 text-sm text-center">
              <Link href="/forgot-password" className="text-luxury-lightGray hover:text-luxury-gold transition-colors">
                Forgot your password?
              </Link>
              <div className="text-luxury-lightGray">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-luxury-gold hover:text-luxury-gold/80 font-medium transition-colors">
                  Register here
                </Link>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-luxury-black">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#C6AA88" }} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}