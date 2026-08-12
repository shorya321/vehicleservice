'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { deleteBusinessAction } from '../actions';

interface DeleteBusinessDialogProps {
  businessId: string | null;
  businessName: string | null;
  hasCustomDomain: boolean;
  bookingCount: number;
  open: boolean;
  onClose: () => void;
  redirectAfterDelete?: string;
}

export function DeleteBusinessDialog({
  businessId,
  businessName,
  hasCustomDomain,
  bookingCount,
  open,
  onClose,
  redirectAfterDelete,
}: DeleteBusinessDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleDelete() {
    if (!businessId) return;

    setIsLoading(true);
    try {
      const result = await deleteBusinessAction(businessId);

      if (result.success) {
        toast.success('Business account deleted', {
          description: `${businessName} has been permanently deleted`,
        });
        onClose();
        if (redirectAfterDelete) {
          router.push(redirectAfterDelete);
        } else {
          router.refresh();
        }
      } else {
        toast.error('Failed to delete', {
          description: result.error || 'An error occurred while deleting the business',
        });
      }
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={() => !isLoading && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Business Account
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                This will permanently delete <strong>{businessName}</strong> and all
                associated data. This action cannot be undone.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {bookingCount > 0 && (
                  <li>{bookingCount} booking{bookingCount > 1 ? 's' : ''} and booking history</li>
                )}
                <li>Wallet balance and all transactions</li>
                <li>All business user accounts (they will need to re-signup)</li>
                <li>Payment methods and saved cards</li>
                {hasCustomDomain && (
                  <li className="font-medium">Custom domain will be removed from Vercel</li>
                )}
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Business
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
