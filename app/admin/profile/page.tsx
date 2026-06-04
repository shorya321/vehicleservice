import { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProfileForm } from "./profile-form"
import { AnimatedPage } from '@/components/layout/animated-page'
import { Breadcrumb } from '@/components/ui/breadcrumb'
export const metadata: Metadata = {
  title: "Profile Settings | Admin",
  description: "Manage your profile settings",
}

export default async function ProfilePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/unauthorized')
  }

  return (
      <AnimatedPage>
        <Breadcrumb items={[{ label: 'Profile', href: '/admin/profile' }]} />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <ProfileForm user={profile} />
      </AnimatedPage>
  )
}