import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { AuthFormCard } from "./auth-form-card"
import { CustomerAuthShell } from "./customer-auth-shell"

interface AuthPageProps {
  initialTab: "login" | "register"
}

export function AuthPage({ initialTab }: AuthPageProps) {
  return (
    <CustomerAuthShell screen={initialTab}>
      <Suspense
        fallback={
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--gold)]" />
          </div>
        }
      >
        <AuthFormCard initialTab={initialTab} />
      </Suspense>
    </CustomerAuthShell>
  )
}
