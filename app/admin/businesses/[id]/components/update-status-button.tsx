'use client';

/**
 * Update Status Button Component
 * Admin control to change business account status
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface UpdateStatusButtonProps {
  businessId: string;
  currentStatus: string;
}

export function UpdateStatusButton({ businessId, currentStatus }: UpdateStatusButtonProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [isLoading, setIsLoading] = useState(false);

  async function handleUpdate() {
    if (newStatus === currentStatus) {
      toast.error('No change: Status is already set to this value');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/businesses/${businessId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update status');
      }

      toast.success(`Status updated: Business account is now ${newStatus}`);

      setIsDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Update Status
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Account Status</DialogTitle>
          <DialogDescription>
            Change the status of this business account
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={newStatus} onValueChange={setNewStatus} disabled={isLoading}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground space-y-1 mt-2">
              <p>
                <strong>Active:</strong> Full access to all features
              </p>
              <p>
                <strong>Suspended:</strong> Login disabled, cannot create bookings
              </p>
              <p>
                <strong>Inactive:</strong> Account temporarily disabled
              </p>
            </div>
          </div>

          <Button onClick={handleUpdate} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Status'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
