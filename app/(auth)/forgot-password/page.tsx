import { Metadata } from "next"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { ForgotPasswordCard } from "@/components/auth/forgot-password-card"
import { CustomerAuthShell } from "@/components/auth/customer-auth-shell"

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your Infinia Transfers account password.",
}

export default function ForgotPasswordPage() {
  return (
    <CustomerAuthShell screen="forgot">
      <Suspense
        fallback={
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--gold)]" />
          </div>
        }
      >
        <ForgotPasswordCard />
      </Suspense>
    </CustomerAuthShell>
  )
}
