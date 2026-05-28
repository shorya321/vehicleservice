import { Metadata } from "next"
import { AuthPage } from "@/components/auth/auth-page"

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Infinia Transfers account to manage bookings and receipts.",
}

export default function LoginPage() {
  return <AuthPage initialTab="login" />
}
