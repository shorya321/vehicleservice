'use client';

/**
 * Clear history older than a chosen cutoff.
 * SCOPE: Business module ONLY.
 *
 * Deliberately high friction: an explicit cutoff choice plus typing the
 * business name. Clearing an audit trail should never be a single misclick, and
 * the surviving activity.purged row means it is never silent either.
 */

import { useState } from 'react';
import { Eraser, Loader2 } from 'lucide-react';
// Portal copies, both deliberately: this dialog opens from a DropdownMenuItem,
// and only the portal AlertDialog clears the pointer-events strand Radix leaves
// on <body> when the two unmount together. The portal Select matches Input.
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { Button } from '@/components/business/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';

type CutoffKey = '3m' | '6m' | '12m' | '24m';

const CUTOFFS: Array<{ key: CutoffKey; label: string; months: number }> = [
  { key: '3m', label: 'Older than 3 months', months: 3 },
  { key: '6m', label: 'Older than 6 months', months: 6 },
  { key: '12m', label: 'Older than 12 months', months: 12 },
  { key: '24m', label: 'Older than 24 months', months: 24 },
];

interface PurgeDialogProps {
  open: boolean;
  businessName: string;
  onOpenChange: (open: boolean) => void;
  onPurged: () => void;
}

export function PurgeDialog({ open, businessName, onOpenChange, onPurged }: PurgeDialogProps) {
  const [cutoff, setCutoff] = useState<CutoffKey>('12m');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmed = confirmation.trim() === businessName.trim();

  async function purge() {
    setBusy(true);
    setError(null);
    try {
      const months = CUTOFFS.find((entry) => entry.key === cutoff)?.months ?? 12;
      const before = new Date();
      before.setMonth(before.getMonth() - months);

      const response = await fetch('/api/business/activity/purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ before: before.toISOString() }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error || 'Failed to clear activity history');
        return;
      }

      setConfirmation('');
      onOpenChange(false);
      onPurged();
    } catch {
      setError('Failed to clear activity history');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Eraser className="h-4 w-4" />
            Clear activity history
          </AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes activity entries older than the cutoff you pick. It
            cannot be undone. Your wallet transactions and bookings are not affected, and a
            record that you cleared history will remain.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Delete entries
            </label>
            <Select value={cutoff} onValueChange={(next) => setCutoff(next as CutoffKey)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CUTOFFS.map((entry) => (
                  <SelectItem key={entry.key} value={entry.key}>{entry.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Type <span className="font-semibold">{businessName}</span> to confirm
            </label>
            <Input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder={businessName}
            />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              disabled={!confirmed || busy}
              onClick={(event) => {
                event.preventDefault();
                void purge();
              }}
            >
              {busy && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Clear history
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
