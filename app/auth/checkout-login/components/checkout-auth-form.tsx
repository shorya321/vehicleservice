'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Loader2, Mail, Lock, User, Phone, Car } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { registerAndAutoVerify } from '../actions'

interface CheckoutAuthFormProps {
  returnUrl: string
}

export function CheckoutAuthForm({ returnUrl }: CheckoutAuthFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form state
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.user) {
        toast.success('Logged in successfully!')
        router.push(decodeURIComponent(returnUrl))
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate passwords match
    if (registerPassword !== registerConfirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate password length
    if (registerPassword.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      // Use server action to register with auto-verified email
      const result = await registerAndAutoVerify({
        email: registerEmail,
        password: registerPassword,
        firstName: firstName,
        lastName: lastName,
        phone: phone
      })

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.success) {
        toast.success('Account created successfully!')
        router.push(decodeURIComponent(returnUrl))
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      className="luxury-card backdrop-blur-md bg-luxury-darkGray/80 border border-luxury-gold/20 rounded-lg p-8 md:p-10"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Logo with Spring Animation */}
      <motion.div
        className="flex items-center justify-center mb-6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
      >
        <div className="h-16 w-16 rounded-lg bg-luxury-gold/10 backdrop-blur-sm border border-luxury-gold/30 flex items-center justify-center">
          <Car className="h-9 w-9" style={{ color: "#C6AA88" }} aria-hidden="true" />
        </div>
      </motion.div>

      <h2 className="font-serif text-2xl md:text-3xl text-luxury-pearl mb-2 text-center">
        Complete Your Booking
      </h2>
      <p className="text-luxury-lightGray text-sm text-center mb-6">
        Sign in or create an account to continue
      </p>

      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-luxury-black/40 border border-luxury-gold/20">
          <TabsTrigger value="login" className="data-[state=active]:bg-luxury-gold data-[state=active]:text-luxury-black uppercase tracking-wider font-semibold">
            Login
          </TabsTrigger>
          <TabsTrigger value="register" className="data-[state=active]:bg-luxury-gold data-[state=active]:text-luxury-black uppercase tracking-wider font-semibold">
            Register
          </TabsTrigger>
        </TabsList>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <Alert className="bg-red-950/50 border-red-900/50" variant="destructive">
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

          {/* Login Tab */}
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-xs text-luxury-lightGray uppercase tracking-wider">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: "#C6AA88" }} aria-hidden="true" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="john@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="h-14 pl-12 bg-luxury-black/40 border-luxury-gold/20 text-luxury-pearl placeholder:text-luxury-lightGray/50 focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-xs text-luxury-lightGray uppercase tracking-wider">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: "#C6AA88" }} aria-hidden="true" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="h-14 pl-12 bg-luxury-black/40 border-luxury-gold/20 text-luxury-pearl placeholder:text-luxury-lightGray/50 focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="text-right">
                <a
                  href="/auth/forgot-password"
                  className="text-sm text-luxury-gold hover:text-luxury-gold/80 font-medium transition-colors"
                  aria-label="Reset your password"
                >
                  Forgot your password?
                </a>
              </div>

              <Button
                type="submit"
                className="w-full h-14 bg-luxury-gold hover:bg-luxury-gold/90 text-luxury-black font-sans uppercase tracking-wider font-semibold transition-all duration-300 active:scale-95"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" style={{ color: "#0A0A0A" }} aria-hidden="true" />
                    SIGNING IN...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name" className="text-xs text-luxury-lightGray uppercase tracking-wider">
                    First Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: "#C6AA88" }} aria-hidden="true" />
                    <Input
                      id="first-name"
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="h-14 pl-12 bg-luxury-black/40 border-luxury-gold/20 text-luxury-pearl placeholder:text-luxury-lightGray/50 focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last-name" className="text-xs text-luxury-lightGray uppercase tracking-wider">
                    Last Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: "#C6AA88" }} aria-hidden="true" />
                    <Input
                      id="last-name"
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="h-14 pl-12 bg-luxury-black/40 border-luxury-gold/20 text-luxury-pearl placeholder:text-luxury-lightGray/50 focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-xs text-luxury-lightGray uppercase tracking-wider">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: "#C6AA88" }} aria-hidden="true" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="john@example.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                    className="h-14 pl-12 bg-luxury-black/40 border-luxury-gold/20 text-luxury-pearl placeholder:text-luxury-lightGray/50 focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs text-luxury-lightGray uppercase tracking-wider">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: "#C6AA88" }} aria-hidden="true" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="h-14 pl-12 bg-luxury-black/40 border-luxury-gold/20 text-luxury-pearl placeholder:text-luxury-lightGray/50 focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-xs text-luxury-lightGray uppercase tracking-wider">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: "#C6AA88" }} aria-hidden="true" />
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    className="h-14 pl-12 bg-luxury-black/40 border-luxury-gold/20 text-luxury-pearl placeholder:text-luxury-lightGray/50 focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-xs text-luxury-lightGray uppercase tracking-wider">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: "#C6AA88" }} aria-hidden="true" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    required
                    className="h-14 pl-12 bg-luxury-black/40 border-luxury-gold/20 text-luxury-pearl placeholder:text-luxury-lightGray/50 focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
                    disabled={loading}
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
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" style={{ color: "#0A0A0A" }} aria-hidden="true" />
                    CREATING ACCOUNT...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              <p className="text-xs text-center text-luxury-lightGray mt-4">
                By creating an account, you agree to our{' '}
                <a href="/terms" className="text-luxury-gold hover:text-luxury-gold/80 font-medium transition-colors">
                  Terms of Service
                </a>
                {' '}and{' '}
                <a href="/privacy" className="text-luxury-gold hover:text-luxury-gold/80 font-medium transition-colors">
                  Privacy Policy
                </a>
              </p>
            </form>

            <Separator className="my-6 border-luxury-gold/20" />
            <div className="text-center">
              <p className="text-sm text-luxury-lightGray mb-3">
                Don't want to create an account?
              </p>
              <Button
                variant="outline"
                onClick={() => router.push(decodeURIComponent(returnUrl))}
                className="border-luxury-gold/30 text-luxury-lightGray hover:bg-luxury-gold/10 hover:text-luxury-pearl uppercase tracking-wider font-sans"
              >
                Continue as Guest
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
  )
}