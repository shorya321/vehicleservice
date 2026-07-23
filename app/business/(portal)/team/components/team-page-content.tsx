'use client';

/**
 * Team Page Content
 * Roster of the business account's owner and staff members.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Users, UserPlus, AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from '../../components/ui/alert-dialog';
import { PageHeader } from '@/app/business/(portal)/components/ui/page-header';
import { PortalSectionCard } from '@/app/business/(portal)/components/ui/section-card';
import { StatusBadge } from '@/components/business/ui/status-badge';
import { EmptyState } from '@/components/business/ui/empty-state';
import { useReducedMotion } from '@/lib/business/animation/hooks';
import { cn } from '@/lib/utils';
import { AddStaffDialog } from './add-staff-dialog';
import { TeamStats } from './team-stats';
import { TeamMemberActions } from './team-member-actions';
import { TeamMemberCard } from './team-member-card';

export interface TeamMember {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface TeamPageContentProps {
  members: TeamMember[];
  /** business_users.id of the signed-in owner, so they can't toggle themselves */
  currentMemberId: string;
  /** business_users.id -> number of bookings they created. Anyone above zero
   *  can only be deactivated, so their Remove button is disabled. */
  bookingCounts: Record<string, number>;
}

const HEAD_CLASS = 'text-xs uppercase tracking-wider text-muted-foreground';

export function TeamPageContent({
  members,
  currentMemberId,
  bookingCounts,
}: TeamPageContentProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  async function handleToggleActive(member: TeamMember) {
    setPendingId(member.id);

    try {
      const response = await fetch('/api/business/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: member.id, is_active: !member.is_active }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Failed to update the team member');
        return;
      }

      toast.success(
        member.is_active
          ? `${member.full_name || member.email} can no longer sign in`
          : `${member.full_name || member.email} can sign in again`
      );
      router.refresh();
    } catch {
      toast.error('Failed to update the team member');
    } finally {
      setPendingId(null);
    }
  }

  async function handleRemove() {
    if (!memberToRemove) return;

    setIsRemoving(true);

    try {
      const response = await fetch(
        `/api/business/team?member_id=${encodeURIComponent(memberToRemove.id)}`,
        { method: 'DELETE' }
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Failed to remove the team member');
        return;
      }

      toast.success(`${memberToRemove.full_name || memberToRemove.email} has been removed`);
      setMemberToRemove(null);
      router.refresh();
    } catch {
      toast.error('Failed to remove the team member');
    } finally {
      setIsRemoving(false);
    }
  }

  const staffCount = members.filter((m) => m.role !== 'owner').length;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Team"
        description="Staff members can create bookings and see only the bookings they created."
        actions={
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add staff member
          </Button>
        }
      />

      <TeamStats members={members} />

      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {/* The header counts every row in the table below it. The staff-only figure is a
            different fact and lives in its own prompt beneath the roster — previously the two
            were conflated, so a solo owner read "No staff members yet" directly above a table
            containing themselves. */}
        <PortalSectionCard
          title="Team Members"
          icon={Users}
          bodyClassName="p-0"
          action={
            <span className="text-xs font-medium tabular-nums text-muted-foreground">
              {members.length} total
            </span>
          }
        >
          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              {/* TableHeader's own `[&_tr]:border-luxury-gold/20` is a descendant rule, so it
                  outranks a border class set on the row and tailwind-merge cannot see the
                  conflict — it has to be neutralised here, on the same element. */}
              <TableHeader className="[&_tr]:border-border">
                <TableRow className="border-border hover:bg-muted/50">
                  <TableHead className={HEAD_CLASS}>Name</TableHead>
                  <TableHead className={HEAD_CLASS}>Email</TableHead>
                  <TableHead className={HEAD_CLASS}>Role</TableHead>
                  <TableHead className={HEAD_CLASS}>Status</TableHead>
                  <TableHead className={cn(HEAD_CLASS, 'w-12 text-right')}>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {members.map((member) => {
                  const isOwner = member.role === 'owner';
                  const isSelf = member.id === currentMemberId;
                  const memberBookings = bookingCounts[member.id] ?? 0;

                  return (
                    <TableRow
                      key={member.id}
                      /* `border-border` (not border-b-border) so tailwind-merge recognises the
                         conflict with TableRow's built-in border-luxury-gold/20. */
                      className="group border-border border-l-2 border-l-transparent transition-all duration-150 hover:border-l-primary hover:bg-muted/50"
                    >
                      <TableCell className="font-medium text-foreground">
                        {member.full_name || '—'}
                        {isSelf && (
                          <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{member.email || '—'}</TableCell>
                      <TableCell className="text-foreground">
                        <Badge
                          variant="outline"
                          className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                        >
                          {isOwner ? 'Owner' : 'Staff'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground">
                        <StatusBadge variant={member.is_active ? 'active' : 'inactive'} showDot>
                          {member.is_active ? 'Active' : 'Deactivated'}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-right text-foreground">
                        {/* Owners have no permitted actions, so they get no trigger at all. */}
                        {isOwner ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <TeamMemberActions
                            member={member}
                            memberBookings={memberBookings}
                            isPending={pendingId === member.id}
                            onToggleActive={() => handleToggleActive(member)}
                            onRemove={() => setMemberToRemove(member)}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 p-4 md:hidden">
            {members.map((member, index) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                index={index}
                isSelf={member.id === currentMemberId}
                isOwner={member.role === 'owner'}
                memberBookings={bookingCounts[member.id] ?? 0}
                isPending={pendingId === member.id}
                prefersReducedMotion={prefersReducedMotion}
                onToggleActive={() => handleToggleActive(member)}
                onRemove={() => setMemberToRemove(member)}
              />
            ))}
          </div>

          {staffCount === 0 && (
            <div className="border-t border-border">
              <EmptyState
                icon={<UserPlus className="h-8 w-8" />}
                title="No staff members yet"
                description="Add a staff member so they can create bookings on your behalf. They will only see the bookings they create themselves."
                action={
                  <Button onClick={() => setDialogOpen(true)} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add staff member
                  </Button>
                }
              />
            </div>
          )}
        </PortalSectionCard>
      </motion.div>

      <AddStaffDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => router.refresh()}
      />

      <AlertDialog
        open={memberToRemove !== null}
        onOpenChange={(open) => {
          if (!open && !isRemoving) {
            setMemberToRemove(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Remove {memberToRemove?.full_name || memberToRemove?.email}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes their account and sign-in. It cannot be undone. Their
              email address becomes available again, so you can re-add them later if you need
              to.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleRemove} disabled={isRemoving}>
              {isRemoving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing…
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
