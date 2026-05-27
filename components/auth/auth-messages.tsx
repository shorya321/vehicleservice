"use client"

import { motion, AnimatePresence } from "motion/react"
import { CheckCircle2, AlertCircle } from "lucide-react"

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
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex items-start gap-3 rounded-[4px] border border-[rgba(var(--gold-rgb),0.3)] bg-[rgba(var(--gold-rgb),0.06)] p-4 text-[0.875rem] text-[var(--text-primary)]"
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
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex items-start gap-3 rounded-[4px] border border-destructive/20 bg-destructive/[0.08] p-4 text-[0.875rem] text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="break-words">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
