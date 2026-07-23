'use client';

/**
 * Row actions for one team member.
 *
 * A MoreHorizontal dropdown, matching the bookings and quotations lists. Previously these were
 * two inline buttons, one of which rendered filled — a roster of deactivated staff showed a
 * column of competing primaries, and the "has bookings" constraint dangled as loose text under
 * them.
 *
 * Shared by the desktop table and the mobile card so the guard expressions exist once. The
 * guards themselves are unchanged: a member who has created bookings can only be deactivated,
 * and a row locks while its own request is in flight.
 */

import { MoreHorizontal, Trash2, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TeamMember } from './team-page-content';

interface TeamMemberActionsProps {
  member: TeamMember;
  /** Number of bookings this member created. Above zero, Remove is not permitted. */
  memberBookings: number;
  /** True while this member's activate/deactivate request is in flight. */
  isPending: boolean;
  onToggleActive: () => void;
  onRemove: () => void;
}

export function TeamMemberActions({
  member,
  memberBookings,
  isPending,
  onToggleActive,
  onRemove,
}: TeamMemberActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          aria-label={`Actions for ${member.full_name || member.email || 'team member'}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* No preventDefault here, unlike Remove below: this action opens nothing, so Radix
            should dismiss the menu normally. Suppressing the close left a stale "Deactivate"
            label sitting over a row that had already flipped to Deactivated. */}
        <DropdownMenuItem disabled={isPending} onSelect={() => onToggleActive()}>
          {member.is_active ? (
            <UserX className="mr-2 h-4 w-4" />
          ) : (
            <UserCheck className="mr-2 h-4 w-4" />
          )}
          {isPending ? 'Saving…' : member.is_active ? 'Deactivate' : 'Reactivate'}
        </DropdownMenuItem>

        {/* Also no preventDefault. Suppressing the close left the menu painted behind the
            confirm dialog. Letting Radix close it is safe here because the portal's own
            AlertDialog clears the `pointer-events: none` this pairing otherwise strands on
            <body> — see app/business/(portal)/components/ui/alert-dialog.tsx. */}
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          disabled={memberBookings > 0 || isPending}
          onSelect={() => onRemove()}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Remove
        </DropdownMenuItem>

        {/* The reason lives with the disabled item rather than loose in the cell, so the owner
            learns the constraint at the point of the attempt. */}
        {memberBookings > 0 && (
          <p className="px-2 py-1.5 text-xs text-muted-foreground">
            Has {memberBookings} booking{memberBookings === 1 ? '' : 's'} — deactivate instead.
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
