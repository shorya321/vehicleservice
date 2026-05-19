import { ThemeToggle } from "@/components/ui/theme-toggle"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <a
        href="#auth-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-[4px] focus:bg-[var(--gold)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--onyx)]"
      >
        Skip to main content
      </a>
      <div className="fixed right-4 top-4 z-50 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <div id="auth-main">
        {children}
      </div>
    </>
  )
}
