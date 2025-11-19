'use client';

/**
 * Reject Business Button Component
 * Admin control to reject pending business accounts
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface RejectButtonProps {
  businessId: string;
  businessName: string;
}

export function RejectButton({ businessId, businessName }: RejectButtonProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  async function handleReject() {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/businesses/${businessId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rejection_reason: rejectionReason.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reject business');
      }

      toast.success(`Business rejected: ${businessName} has been denied access`);
      setIsDialogOpen(false);
      setRejectionReason('');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reject business');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <XCircle className="mr-2 h-4 w-4" />
          Reject Business
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Business Account?</DialogTitle>
          <DialogDescription>
            You are about to reject <strong>{businessName}</strong>.
            <br />
            <br />
            This will:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Change the account status to &quot;Rejected&quot;</li>
              <li>Prevent the business from logging in</li>
              <li>Block access to their portal permanently</li>
            </ul>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">
              Rejection Reason <span className="text-muted-foreground text-xs">(Optional)</span>
            </Label>
            <Textarea
              id="rejection-reason"
              placeholder="e.g., Incomplete information, suspicious activity, etc."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              disabled={isLoading}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              This reason will be stored internally for future reference
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleReject} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rejecting...
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Reject Business
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
