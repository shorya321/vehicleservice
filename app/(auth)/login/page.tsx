import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AuthPage } from "@/components/auth/auth-page"

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Infinia Transfers account to manage bookings and receipts.",
}

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile) {
      switch (profile.role) {
        case 'customer':
          redirect('/account')
        case 'vendor':
          redirect('/vendor/dashboard')
        case 'admin':
          redirect('/admin/dashboard')
      }
    }
  }

  return <AuthPage initialTab="login" />
}
