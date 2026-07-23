'use client';

/**
 * One team member, as a card.
 *
 * The desktop roster is a five-column table with an actions column, which does not survive a
 * 375px viewport. Mirrors quotations/components/quotation-mobile-card.tsx.
 */

import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/business/ui/status-badge';
import { TeamMemberActions } from './team-member-actions';
import type { TeamMember } from './team-page-content';

interface TeamMemberCardProps {
  member: TeamMember;
  index: number;
  /** The signed-in owner's own row, labelled so they can tell themselves apart. */
  isSelf: boolean;
  isOwner: boolean;
  memberBookings: number;
  isPending: boolean;
  prefersReducedMotion: boolean;
  onToggleActive: () => void;
  onRemove: () => void;
}

export function TeamMemberCard({
  member,
  index,
  isSelf,
  isOwner,
  memberBookings,
  isPending,
  prefersReducedMotion,
  onToggleActive,
  onRemove,
}: TeamMemberCardProps) {
  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={prefersReducedMotion ? undefined : { y: -2 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Card className="rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-md">
        <CardContent className="p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {member.full_name || '—'}
                {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
              </p>
              <p className="truncate text-xs text-muted-foreground">{member.email || '—'}</p>
            </div>
            {/* Owners have no permitted actions, so they get no trigger at all. */}
            {!isOwner && (
              <TeamMemberActions
                member={member}
                memberBookings={memberBookings}
                isPending={isPending}
                onToggleActive={onToggleActive}
                onRemove={onRemove}
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs font-medium">
              {isOwner ? 'Owner' : 'Staff'}
            </Badge>
            <StatusBadge variant={member.is_active ? 'active' : 'inactive'} showDot>
              {member.is_active ? 'Active' : 'Deactivated'}
            </StatusBadge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
