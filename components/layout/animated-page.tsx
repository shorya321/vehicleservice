"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"

interface AnimatedPageProps {
  children: ReactNode
}

export function AnimatedPage({ children }: AnimatedPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-6"
    >
      {children}
    </motion.div>
  )
}
