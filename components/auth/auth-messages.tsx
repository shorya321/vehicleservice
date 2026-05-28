"use client"

import { motion, AnimatePresence } from "motion/react"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { fadeAlert } from "@/lib/auth/motion"

interface AuthMessagesProps {
  successMessage: string | null
  error: string | null
}

export function AuthMessages({ successMessage, error }: AuthMessagesProps) {
  return (
    <>
      <AnimatePresence>
        {successMessage && (
          <motion.div
            key="success"
            role="status"
            aria-live="polite"
            {...fadeAlert}
            className="mt-8 auth-alert-success auth-alert-text text-[var(--text-primary)]"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" aria-hidden="true" />
            <p className="break-words">{successMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            key="error"
            role="alert"
            aria-live="assertive"
            {...fadeAlert}
            className="mt-8 auth-alert-error auth-alert-text text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="break-words">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
