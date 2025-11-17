"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, Loader2, Save, Shield, Bell, User } from "lucide-react"
import { toast } from "sonner"
import { updateProfile, uploadAvatar, updatePassword, getNotificationPreferences, updateNotificationPreferences } from "./actions"
import type { User } from "@/lib/types/user"
import { Switch } from "@/components/ui/switch"

const profileFormSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
})

const passwordFormSchema = z.object({
  current_password: z.string().min(6, "Password must be at least 6 characters"),
  new_password: z.string().min(6, "Password must be at least 6 characters"),
  confirm_password: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
})

interface ProfileFormProps {
  user: User
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [notificationPreferences, setNotificationPreferences] = useState({
    email_new_user_registration: true,
    email_security_alerts: true,
    email_system_updates: true,
  })
  const [savingNotifications, setSavingNotifications] = useState(false)

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: user.full_name || "",
      email: user.email,
      phone: user.phone || "",
    },
  })

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  })

  useEffect(() => {
    // Fetch notification preferences on mount
    const fetchPreferences = async () => {
      const prefs = await getNotificationPreferences(user.id)
      if (prefs) {
        setNotificationPreferences({
          email_new_user_registration: prefs.email_new_user_registration,
          email_security_alerts: prefs.email_security_alerts,
          email_system_updates: prefs.email_system_updates,
        })
      }
    }
    fetchPreferences()
  }, [user.id])

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  async function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
    setLoading(true)
    try {
      const result = await updateProfile(user.id, values)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Profile updated successfully")
        router.refresh()
      }
    } catch (error) {
      toast.error("Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
    setLoading(true)
    try {
      const result = await updatePassword(values.current_password, values.new_password)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Password updated successfully")
        passwordForm.reset()
      }
    } catch (error) {
      toast.error("Failed to update password")
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setUploadingAvatar(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const result = await uploadAvatar(user.id, formData)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Avatar uploaded successfully")
        router.refresh()
      }
    } catch (error) {
      toast.error('Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  return (
    <Tabs defaultValue="general" className="space-y-4">
      <TabsList>
        <TabsTrigger value="general" className="gap-2">
          <User className="h-4 w-4" />
          General
        </TabsTrigger>
        <TabsTrigger value="security" className="gap-2">
          <Shield className="h-4 w-4" />
          Security
        </TabsTrigger>
        <TabsTrigger value="notifications" className="gap-2">
          <Bell className="h-4 w-4" />
          Notifications
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>
              Upload a profile picture to personalize your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage 
                  src={user.avatar_url || undefined} 
                  alt={user.full_name || user.email}
                />
                <AvatarFallback className="text-2xl">
                  {getInitials(user.full_name, user.email)}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <Button
                  variant="outline"
                  disabled={uploadingAvatar}
                  asChild
                >
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    {uploadingAvatar ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    {uploadingAvatar ? 'Uploading...' : 'Upload Picture'}
                  </label>
                </Button>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  Recommended: Square image, at least 200x200px
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} disabled />
                      </FormControl>
                      <FormDescription>
                        Email cannot be changed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="current_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="new_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="confirm_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Two-Factor Authentication</CardTitle>
            <CardDescription>
              Add an extra layer of security to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  Two-factor authentication is {user.two_factor_enabled ? 'enabled' : 'disabled'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {user.two_factor_enabled 
                    ? 'Your account is protected with 2FA' 
                    : 'Enable 2FA for enhanced security'}
                </p>
              </div>
              <Button variant={user.two_factor_enabled ? "destructive" : "default"}>
                {user.two_factor_enabled ? 'Disable 2FA' : 'Enable 2FA'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Email Notifications</CardTitle>
            <CardDescription>
              Configure how you receive email notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">New User Registrations</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when new users sign up
                  </p>
                </div>
                <Switch
                  checked={notificationPreferences.email_new_user_registration}
                  onCheckedChange={async (checked) => {
                    setNotificationPreferences(prev => ({
                      ...prev,
                      email_new_user_registration: checked
                    }))
                    setSavingNotifications(true)
                    try {
                      const result = await updateNotificationPreferences(user.id, {
                        email_new_user_registration: checked
                      })
                      if (result.error) {
                        toast.error(result.error)
                        // Revert on error
                        setNotificationPreferences(prev => ({
                          ...prev,
                          email_new_user_registration: !checked
                        }))
                      } else {
                        toast.success("Notification preference updated")
                      }
                    } catch (error) {
                      toast.error("Failed to update preference")
                      // Revert on error
                      setNotificationPreferences(prev => ({
                        ...prev,
                        email_new_user_registration: !checked
                      }))
                    } finally {
                      setSavingNotifications(false)
                    }
                  }}
                  disabled={savingNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Security Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Important security notifications
                  </p>
                </div>
                <Switch
                  checked={notificationPreferences.email_security_alerts}
                  onCheckedChange={async (checked) => {
                    setNotificationPreferences(prev => ({
                      ...prev,
                      email_security_alerts: checked
                    }))
                    setSavingNotifications(true)
                    try {
                      const result = await updateNotificationPreferences(user.id, {
                        email_security_alerts: checked
                      })
                      if (result.error) {
                        toast.error(result.error)
                        // Revert on error
                        setNotificationPreferences(prev => ({
                          ...prev,
                          email_security_alerts: !checked
                        }))
                      } else {
                        toast.success("Notification preference updated")
                      }
                    } catch (error) {
                      toast.error("Failed to update preference")
                      // Revert on error
                      setNotificationPreferences(prev => ({
                        ...prev,
                        email_security_alerts: !checked
                      }))
                    } finally {
                      setSavingNotifications(false)
                    }
                  }}
                  disabled={savingNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">System Updates</p>
                  <p className="text-sm text-muted-foreground">
                    Updates about system maintenance and features
                  </p>
                </div>
                <Switch
                  checked={notificationPreferences.email_system_updates}
                  onCheckedChange={async (checked) => {
                    setNotificationPreferences(prev => ({
                      ...prev,
                      email_system_updates: checked
                    }))
                    setSavingNotifications(true)
                    try {
                      const result = await updateNotificationPreferences(user.id, {
                        email_system_updates: checked
                      })
                      if (result.error) {
                        toast.error(result.error)
                        // Revert on error
                        setNotificationPreferences(prev => ({
                          ...prev,
                          email_system_updates: !checked
                        }))
                      } else {
                        toast.success("Notification preference updated")
                      }
                    } catch (error) {
                      toast.error("Failed to update preference")
                      // Revert on error
                      setNotificationPreferences(prev => ({
                        ...prev,
                        email_system_updates: !checked
                      }))
                    } finally {
                      setSavingNotifications(false)
                    }
                  }}
                  disabled={savingNotifications}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}