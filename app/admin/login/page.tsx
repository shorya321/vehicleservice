import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/actions"
import AdminLoginForm from "./components/admin-login-form"

export default async function AdminLoginPage() {
  const user = await getCurrentUser()

  if (user) {
    if (user.profile?.role === "admin") {
      redirect("/admin/dashboard")
    }
    redirect("/")
  }

  return <AdminLoginForm />
}
