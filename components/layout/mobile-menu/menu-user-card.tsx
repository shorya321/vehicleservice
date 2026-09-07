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
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
}

export function MenuUserCard({ user, profile, getInitials, onClose, reducedMotion }: MenuUserCardProps) {
  if (!user) {
    return (
      <motion.div
        className="px-4 space-y-2"
        variants={reducedMotion ? undefined : cardVariants}
      >
        <p className="text-[10px] font-body font-semibold tracking-[0.25em] uppercase text-[var(--text-muted)] text-center">
          Member Access
        </p>
        <div className="flex gap-3">
          <Link
            href="/login"
            onClick={onClose}
            className="flex-1 min-h-[48px] flex items-center justify-center text-sm font-body rounded-lg border border-[rgba(var(--gold-rgb),0.3)] text-[var(--gold-text)] hover:bg-[rgba(var(--gold-rgb),0.1)] active:bg-[rgba(var(--gold-rgb),0.16)] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            onClick={onClose}
            className="flex-1 min-h-[48px] flex items-center justify-center text-sm font-body font-medium rounded-lg bg-[var(--gold)] text-[var(--onyx)] hover:bg-[var(--gold-deep)] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]"
          >
            Sign Up
          </Link>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="mx-4 rounded-lg bg-[rgba(var(--charcoal-rgb),0.5)] border border-[rgba(var(--gold-rgb),0.1)] overflow-hidden"
      variants={reducedMotion ? undefined : cardVariants}
    >
      {/* Gold seam. Written as an inline gradient rather than `via-[...]` so it
          cannot fall into the same Tailwind opacity-modifier trap that made the
          card's fill and border invisible. */}
      <div
        className="h-px"
        aria-hidden="true"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(var(--gold-rgb),0.35), transparent)',
        }}
      />
      <div className="p-3 flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarImage
            src={profile?.avatar_url || undefined}
            alt={profile?.full_name || profile?.first_name || user.email}
          />
          <AvatarFallback className="bg-[var(--charcoal)] text-[var(--gold-text)] text-sm">
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
