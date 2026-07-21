'use client';

/**
 * Team Page Content
 * Roster of the business account's owner and staff members.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Users, UserPlus, AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { AddStaffDialog } from './add-staff-dialog';

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

export function TeamPageContent({
  members,
  currentMemberId,
  bookingCounts,
}: TeamPageContentProps) {
  const router = useRouter();
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Team</h1>
          <p className="text-sm text-muted-foreground">
            Staff members can create bookings and see only the bookings they created.
          </p>
        </div>

        <Button onClick={() => setDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add staff member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />
            {staffCount === 0
              ? 'No staff members yet'
              : `${staffCount} staff member${staffCount === 1 ? '' : 's'}`}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {members.map((member) => {
                  const isOwner = member.role === 'owner';
                  const isSelf = member.id === currentMemberId;
                  const memberBookings = bookingCounts[member.id] ?? 0;

                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.full_name || '—'}
                        {isSelf && (
                          <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{member.email || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={isOwner ? 'default' : 'secondary'}>
                          {isOwner ? 'Owner' : 'Staff'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.is_active ? 'outline' : 'destructive'}>
                          {member.is_active ? 'Active' : 'Deactivated'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isOwner ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant={member.is_active ? 'outline' : 'default'}
                                size="sm"
                                disabled={pendingId === member.id}
                                onClick={() => handleToggleActive(member)}
                              >
                                {pendingId === member.id
                                  ? 'Saving…'
                                  : member.is_active
                                    ? 'Deactivate'
                                    : 'Reactivate'}
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                disabled={memberBookings > 0 || pendingId === member.id}
                                onClick={() => setMemberToRemove(member)}
                              >
                                <Trash2 className="mr-1.5 h-4 w-4" />
                                Remove
                              </Button>
                            </div>

                            {memberBookings > 0 && (
                              <span className="text-xs text-muted-foreground">
                                Has {memberBookings} booking{memberBookings === 1 ? '' : 's'} —
                                deactivate instead
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
