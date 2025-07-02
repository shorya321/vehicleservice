"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createUser, updateUser } from "../actions"
import { User, UserFormData, CreateUserData, PasswordOption } from "@/lib/types/user"
import { Loader2, Copy, Eye, EyeOff, RefreshCw } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { generateSecurePassword, validatePasswordStrength } from "@/lib/utils/password"

interface UserFormProps {
  user?: User | null
  mode: "create" | "edit"
}

export function UserForm({ user, mode }: UserFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [passwordOption, setPasswordOption] = useState<PasswordOption>('generate')
  const [customPassword, setCustomPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [passwordStrength, setPasswordStrength] = useState<ReturnType<typeof validatePasswordStrength> | null>(null)

  const [formData, setFormData] = useState<UserFormData>({
    email: user?.email || "",
    full_name: user?.full_name || "",
    phone: user?.phone || "",
    role: user?.role || "customer",
    status: user?.status || "active",
    avatar_url: user?.avatar_url || "",
  })

  const handleGeneratePassword = () => {
    const newPassword = generateSecurePassword(12)
    setGeneratedPassword(newPassword)
    setCustomPassword(newPassword)
    const strength = validatePasswordStrength(newPassword)
    setPasswordStrength(strength)
  }

  const handlePasswordChange = (value: string) => {
    setCustomPassword(value)
    if (value) {
      const strength = validatePasswordStrength(value)
      setPasswordStrength(strength)
    } else {
      setPasswordStrength(null)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      if (mode === "create") {
        // Validate password for custom option
        if (passwordOption === 'custom' && !customPassword) {
          setError('Please enter a password')
          setLoading(false)
          return
        }

        if (passwordOption === 'custom' && passwordStrength && !passwordStrength.isValid) {
          setError('Password does not meet security requirements')
          setLoading(false)
          return
        }

        const result = await createUser({
          ...formData,
          password: passwordOption === 'custom' ? customPassword : undefined,
          password_option: passwordOption,
        } as CreateUserData)

        if (result.error) {
          setError(result.error)
        } else {
          if (result.temporaryPassword) {
            setSuccess(
              <div className="space-y-2">
                <p>User created successfully!</p>
                <div className="bg-muted p-3 rounded-md space-y-2">
                  <p className="text-sm font-medium">Temporary Password:</p>
                  <div className="flex items-center gap-2">
                    <code className="bg-background px-2 py-1 rounded text-sm font-mono flex-1">
                      {result.temporaryPassword}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(result.temporaryPassword!)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Please share this password securely with the user
                  </p>
                </div>
              </div> as any
            )
            // Don't auto-redirect when showing password
          } else if (result.passwordOption === 'reset_link') {
            setSuccess("User created successfully! A password reset link has been sent to their email.")
            setTimeout(() => {
              router.push("/admin/users")
              router.refresh()
            }, 2000)
          } else {
            setSuccess("User created successfully!")
            setTimeout(() => {
              router.push("/admin/users")
              router.refresh()
            }, 2000)
          }
        }
      } else if (user) {
        const result = await updateUser(user.id, formData)

        if (result.error) {
          setError(result.error)
        } else {
          setSuccess("User updated successfully!")
          
          setTimeout(() => {
            router.push("/admin/users")
            router.refresh()
          }, 1500)
        }
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            User profile and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone || ""}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar_url">Avatar URL</Label>
              <Input
                id="avatar_url"
                type="url"
                value={formData.avatar_url || ""}
                onChange={(e) =>
                  setFormData({ ...formData, avatar_url: e.target.value })
                }
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Access Control</CardTitle>
          <CardDescription>
            User role and account status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, role: value })
                }
                disabled={loading}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="driver">Driver</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, status: value })
                }
                disabled={loading}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

        </CardContent>
      </Card>

      {mode === "create" && (
        <Card>
          <CardHeader>
            <CardTitle>Password Setup</CardTitle>
            <CardDescription>
              Choose how the user will receive their password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={passwordOption}
              onValueChange={(value) => setPasswordOption(value as PasswordOption)}
              disabled={loading}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="generate" id="generate" />
                <Label htmlFor="generate" className="font-normal cursor-pointer">
                  Generate a secure temporary password
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="font-normal cursor-pointer">
                  Set a custom password
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="reset_link" id="reset_link" />
                <Label htmlFor="reset_link" className="font-normal cursor-pointer">
                  Send password reset link via email
                </Label>
              </div>
            </RadioGroup>

            {passwordOption === 'custom' && (
              <div className="space-y-3 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={customPassword}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        disabled={loading}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleGeneratePassword}
                      disabled={loading}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {passwordStrength && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className={`h-full rounded-full transition-all ${
                            passwordStrength.score <= 2
                              ? "bg-red-500"
                              : passwordStrength.score <= 4
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {passwordStrength.score <= 2
                          ? "Weak"
                          : passwordStrength.score <= 4
                          ? "Fair"
                          : "Strong"}
                      </span>
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {passwordStrength.feedback.map((item, index) => (
                          <li key={index}>• {item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}

            {passwordOption === 'reset_link' && (
              <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                The user will receive an email with a link to set their own password
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === "create" ? "Creating..." : "Updating..."}
            </>
          ) : mode === "create" ? (
            "Create User"
          ) : (
            "Update User"
          )}
        </Button>
      </div>
    </form>
  )
}