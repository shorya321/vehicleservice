import { Metadata } from "next"
import { AuthPage } from "@/components/auth/auth-page"

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create an Infinia Transfers account to save your details and track bookings.",
}

export default function RegisterPage() {
  return <AuthPage initialTab="register" />
}
