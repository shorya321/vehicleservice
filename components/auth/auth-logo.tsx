import Link from "next/link"

export function AuthLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`footer-logo text-2xl hover:opacity-80 transition-opacity ${className ?? ""}`}
    >
      Infinia <span>Transfers</span>
    </Link>
  )
}
