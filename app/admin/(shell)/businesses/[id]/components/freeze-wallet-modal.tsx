'use client';

/**
 * Freeze/Unfreeze Wallet Modal Component
 * Allows admins to freeze or unfreeze business wallets
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Lock, Unlock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface FreezeWalletModalProps {
  open: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
  isFrozen: boolean;
  onSuccess: () => void;
}

export function FreezeWalletModal({
  open,
  onClose,
  businessId,
  businessName,
  isFrozen,
  onSuccess,
}: FreezeWalletModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (reason.trim().length < 10) {
      toast.error('Reason must be at least 10 characters');
      return;
    }

    setIsLoading(true);

    try {
      const url = `/api/admin/businesses/${businessId}/wallet/freeze`;
      const response = await fetch(url, {
        method: isFrozen ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: reason.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${isFrozen ? 'unfreeze' : 'freeze'} wallet`);
      }

      toast.success(`Wallet ${isFrozen ? 'unfrozen' : 'frozen'} successfully`);
      onSuccess();
    } catch (error) {
      console.error(`Error ${isFrozen ? 'unfreezing' : 'freezing'} wallet:`, error);
      toast.error(error instanceof Error ? error.message : 'Failed to update wallet status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setReason('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {isFrozen ? (
              <>
                <Unlock className="mr-2 h-5 w-5" />
                Unfreeze Wallet
              </>
            ) : (
              <>
                <Lock className="mr-2 h-5 w-5" />
                Freeze Wallet
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isFrozen ? (
              <>Restore normal operations for {businessName}&apos;s wallet</>
            ) : (
              <>Prevent all transactions for {businessName}&apos;s wallet</>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Warning Message */}
            <div
              className={`flex items-start gap-2 p-4 rounded-lg border ${
                isFrozen
                  ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                  : 'bg-destructive/10 border-destructive'
              }`}
            >
              {isFrozen ? (
                <Unlock className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              )}
              <div className="text-sm">
                {isFrozen ? (
                  <>
                    <p className="font-medium text-green-600 dark:text-green-400 mb-1">
                      Unfreezing Wallet
                    </p>
                    <p className="text-muted-foreground">
                      The business will be able to:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Make bookings using wallet balance</li>
                      <li>Add funds to wallet</li>
                      <li>Perform all wallet operations</li>
                    </ul>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-destructive mb-1">Warning: Freezing Wallet</p>
                    <p className="text-muted-foreground">
                      The business will NOT be able to:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Make bookings using wallet balance</li>
                      <li>Deduct funds from wallet</li>
                      <li>Use wallet for any transactions</li>
                    </ul>
                    <p className="mt-2 text-muted-foreground italic">
                      Note: They can still add funds to the wallet, but cannot spend.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder={
                  isFrozen
                    ? 'Provide a reason for unfreezing this wallet (minimum 10 characters)'
                    : 'Provide a detailed reason for freezing this wallet (minimum 10 characters)'
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                {reason.length}/10 characters minimum
              </p>
            </div>

            {/* Business Name Confirmation */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Business:</p>
              <p className="font-medium">{businessName}</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={isFrozen ? 'default' : 'destructive'}
              disabled={isLoading || reason.trim().length < 10}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isFrozen ? (
                <>
                  <Unlock className="mr-2 h-4 w-4" />
                  Unfreeze Wallet
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Freeze Wallet
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
