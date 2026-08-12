'use client';

/**
 * Clear notifications older than a chosen cutoff.
 *
 * The preview is the point of this dialog, not decoration. count_notification_purge
 * and purge_notifications take the same arguments and share the same predicate, so
 * the number rendered here is the number that gets deleted. The confirm stays
 * disabled until a count has actually come back, so a purge whose scope was never
 * displayed cannot be run.
 *
 * Friction matches the business activity purge: a destructive selection, meaning
 * Everything or a scope covering every user, also demands the admin type their own
 * email. A dated cutoff on your own feed does not.
 */

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Eraser, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NotificationPurgePreview } from '@/lib/notifications/types';
import { formatBookingDate } from '@/lib/utils/timezone';
import { previewNotificationPurgeAction, purgeNotificationsAction } from '../actions';

type CutoffKey = '30d' | '90d' | '6m' | '1y' | 'all';

const CUTOFFS: Array<{ key: CutoffKey; label: string; days: number | null }> = [
  { key: '30d', label: 'Older than 30 days', days: 30 },
  { key: '90d', label: 'Older than 90 days', days: 90 },
  { key: '6m', label: 'Older than 6 months', days: 182 },
  { key: '1y', label: 'Older than 1 year', days: 365 },
  { key: 'all', label: 'Everything', days: null },
];

type ScopeKey = 'self' | 'all_users';

interface PurgeDialogProps {
  open: boolean;
  adminEmail: string;
  onOpenChange: (open: boolean) => void;
  onPurged: () => void;
}

/**
 * Elapsed time, so plain arithmetic is correct here. Converting through the operating
 * timezone would be wrong: "30 days ago" is a duration, not a calendar boundary.
 */
function cutoffToIso(key: CutoffKey): string | null {
  const days = CUTOFFS.find((entry) => entry.key === key)?.days ?? null;
  if (days === null) return null;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export function PurgeDialog({ open, adminEmail, onOpenChange, onPurged }: PurgeDialogProps) {
  const [cutoff, setCutoff] = useState<CutoffKey>('90d');
  const [scope, setScope] = useState<ScopeKey>('self');
  const [confirmation, setConfirmation] = useState('');
  const [preview, setPreview] = useState<NotificationPurgePreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const destructive = cutoff === 'all' || scope === 'all_users';
  const confirmed = !destructive || confirmation.trim() === adminEmail.trim();

  const loadPreview = useCallback(async () => {
    setPreviewing(true);
    setError(null);
    setPreview(null);
    try {
      const result = await previewNotificationPurgeAction(
        cutoffToIso(cutoff),
        scope === 'all_users'
      );

      if (result.error || !result.data) {
        setError(result.error || 'Failed to preview the purge');
        return;
      }

      setPreview(result.data);
    } catch {
      setError('Failed to preview the purge');
    } finally {
      setPreviewing(false);
    }
  }, [cutoff, scope]);

  // Refresh whenever the dialog opens or either control changes, so the number on
  // screen always describes the current selection.
  useEffect(() => {
    if (!open) return;
    void loadPreview();
  }, [open, loadPreview]);

  // Reset the typed confirmation on close, so reopening never starts pre-confirmed.
  useEffect(() => {
    if (!open) {
      setConfirmation('');
      setError(null);
    }
  }, [open]);

  async function purge() {
    setBusy(true);
    setError(null);
    try {
      const result = await purgeNotificationsAction(
        cutoffToIso(cutoff),
        scope === 'all_users'
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      setConfirmation('');
      onOpenChange(false);
      onPurged();
    } catch {
      setError('Failed to clear notifications');
    } finally {
      setBusy(false);
    }
  }

  const nothingToDelete = preview !== null && preview.total === 0;

  // Two mutually exclusive messages, picked by scope so the wording is always true of
  // the numbers behind it.
  //
  // Scoped to yourself, the interesting survivors are other people's rows: they never
  // appear on this page, so their existence is invisible without being told. Scoped to
  // everyone, nobody else's rows can survive, and the only leftovers are rows newer
  // than the cutoff, which would be a lie to call "other users'".
  const survivorWarning = (() => {
    if (!preview) return null;

    if (scope === 'self' && preview.others_total > 0) {
      const n = preview.others_total;
      const u = preview.others_users;
      return `${n} ${n === 1 ? 'notification' : 'notifications'} belonging to ${u} other ${
        u === 1 ? 'user' : 'users'
      } ${n === 1 ? 'is' : 'are'} not shown on this page and will remain. Switch "Whose notifications" to All users to include ${
        n === 1 ? 'it' : 'them'
      }.`;
    }

    if (scope === 'all_users' && preview.remaining_total > 0) {
      const n = preview.remaining_total;
      return `${n} ${n === 1 ? 'notification' : 'notifications'} newer than the cutoff will remain.`;
    }

    return null;
  })();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Eraser className="h-4 w-4" />
            Clear notifications
          </AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes notifications matching the cutoff you pick. It cannot
            be undone. Bookings, payments and every other record are untouched, and a
            record that you cleared notifications is kept in the activity log.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Scope first, deliberately. It used to sit under the cutoff, which made it
              read as a passive default next to the control the admin actively changed.
              The first thing you pick should be whose data you are about to destroy. */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Whose notifications
            </label>
            <Select value={scope} onValueChange={(next) => setScope(next as ScopeKey)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="self">My notifications</SelectItem>
                <SelectItem value="all_users">All users</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Delete notifications
            </label>
            <Select value={cutoff} onValueChange={(next) => setCutoff(next as CutoffKey)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CUTOFFS.map((entry) => (
                  <SelectItem key={entry.key} value={entry.key}>
                    {entry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* The reference line. Never let a purge run without this having rendered. */}
          <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
            {previewing && (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Checking what this will remove
              </span>
            )}

            {!previewing && preview && preview.total > 0 && (
              <p className="text-foreground">
                This will delete <span className="font-semibold">{preview.total}</span>{' '}
                {preview.total === 1 ? 'notification' : 'notifications'} (
                {preview.unread} unread) across{' '}
                <span className="font-semibold">{preview.users}</span>{' '}
                {preview.users === 1 ? 'user' : 'users'}
                {preview.oldest && preview.newest && (
                  <>
                    , dated {formatBookingDate(preview.oldest)} to{' '}
                    {formatBookingDate(preview.newest)}
                  </>
                )}
                .
              </p>
            )}

            {!previewing && nothingToDelete && (
              <span className="text-muted-foreground">
                Nothing matches this selection.
              </span>
            )}

            {!previewing && !preview && !error && (
              <span className="text-muted-foreground">No preview available.</span>
            )}
          </div>

          {/* What survives. This is the half that was missing: the dialog only ever
              said what it would delete, so "Everything" scoped to one admin read as
              "everything in the table". Rendered even when nothing matches, because
              that is exactly when an admin most needs telling other people's rows
              exist. The wording branches on scope so it is never inaccurate. */}
          {!previewing && preview && survivorWarning && (
            <p className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{survivorWarning}</span>
            </p>
          )}

          {destructive && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Type <span className="font-semibold">{adminEmail}</span> to confirm
              </label>
              <Input
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder={adminEmail}
                autoComplete="off"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              disabled={!confirmed || busy || previewing || !preview || nothingToDelete}
              onClick={(event) => {
                event.preventDefault();
                void purge();
              }}
            >
              {busy && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Clear notifications
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
