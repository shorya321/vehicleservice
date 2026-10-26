import { Metadata } from "next"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { ResetPasswordCard } from "@/components/auth/reset-password-card"
import { CustomerAuthShell } from "@/components/auth/customer-auth-shell"

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your Infinia Transfers account.",
}

export default function ResetPasswordPage() {
  return (
    <CustomerAuthShell screen="reset">
      <Suspense
        fallback={
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--gold)]" />
          </div>
        }
      >
        <ResetPasswordCard />
      </Suspense>
    </CustomerAuthShell>
  )
}
