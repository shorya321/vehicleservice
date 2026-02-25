'use client'

import { motion, type Variants } from 'motion/react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface MenuUserCardProps {
  user: SupabaseUser | null
  profile: Profile | null
  getInitials: (profile: Profile | null) => string
  onClose: () => void
  reducedMotion?: boolean
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: 'easeOut' } },
}

export function MenuUserCard({ user, profile, getInitials, onClose, reducedMotion }: MenuUserCardProps) {
  if (!user) {
    return (
      <motion.div
        className="flex gap-3 px-3"
        variants={reducedMotion ? undefined : cardVariants}
      >
        <Link
          href="/login"
          onClick={onClose}
          className="flex-1 py-2.5 text-center text-sm font-body rounded-lg border border-[var(--gold)]/30 text-[var(--gold)] hover:bg-[var(--gold)]/10 transition-colors duration-200"
        >
          Login
        </Link>
        <Link
          href="/register"
          onClick={onClose}
          className="flex-1 py-2.5 text-center text-sm font-body rounded-lg bg-[var(--gold)] text-[var(--black-void)] hover:bg-[var(--gold)]/90 transition-colors duration-200 font-medium"
        >
          Sign Up
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="mx-3 p-3 rounded-lg bg-[var(--charcoal)]/50 border border-[var(--gold)]/10"
      variants={reducedMotion ? undefined : cardVariants}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarImage
            src={profile?.avatar_url || undefined}
            alt={profile?.full_name || profile?.first_name || user.email}
          />
          <AvatarFallback className="bg-[var(--charcoal)] text-[var(--gold)] text-sm">
            {getInitials(profile)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
            {profile?.full_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'User'}
          </p>
          <p className="text-xs text-[var(--text-muted)] truncate">
            {user.email}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
