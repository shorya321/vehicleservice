'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/business/ui/button';
import { Card, CardContent } from '@/components/business/ui/card';
import { EmptyState } from '@/components/business/ui/empty-state';
import { businessTripTypeLabel } from '@/lib/business/trips/display';

export interface BusinessTrashRow {
  id: string;
  tripLabel: string;
  tripType: string | null;
  customerName: string;
  legCount: number;
  bookingStatus: string | null;
  pickupAt: string;
  deletedAt: string;
  deletedBy: string;
  expiresAt: string;
}

interface TrashListProps {
  rows: BusinessTrashRow[];
}

export function TrashList({ rows }: TrashListProps) {
  const router = useRouter();
  const [restoringId, setRestoringId] = useState<string | null>(null);

  async function restore(row: BusinessTrashRow): Promise<void> {
    setRestoringId(row.id);
    try {
      const response = await fetch(`/api/business/bookings/trash/${row.id}/restore`, { method: 'POST' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(result.error || 'Failed to restore booking');
        return;
      }
      toast.success(`${row.tripLabel} restored`);
      router.refresh();
    } catch {
      toast.error('Failed to restore booking');
    } finally {
      setRestoringId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<Trash2 className="h-6 w-6" />}
        title="Trash is empty"
        description="Bookings you delete stay here for 30 days, so you can restore one deleted by mistake."
      />
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <Card key={row.id}>
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="font-medium text-foreground">
                {row.tripLabel}
                <span className="ml-2 text-sm font-normal text-muted-foreground">{row.customerName}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {businessTripTypeLabel({ trip_type: row.tripType })}
                {row.legCount > 1 ? `, ${row.legCount} journeys` : ''}
                {row.pickupAt ? `. Pickup ${row.pickupAt}` : ''}
                {row.bookingStatus ? `. ${row.bookingStatus.charAt(0).toUpperCase()}${row.bookingStatus.slice(1)}` : ''}
              </div>
              <div className="text-xs text-muted-foreground">
                Deleted {row.deletedAt} by {row.deletedBy}. Removed for good on {row.expiresAt}.
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-2"
              disabled={restoringId !== null}
              onClick={() => restore(row)}
            >
              {restoringId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              Restore
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
