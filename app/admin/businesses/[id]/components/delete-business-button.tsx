'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeleteBusinessDialog } from '../../components/delete-business-dialog';

interface DeleteBusinessButtonProps {
  businessId: string;
  businessName: string;
  hasCustomDomain: boolean;
  bookingCount: number;
}

export function DeleteBusinessButton({
  businessId,
  businessName,
  hasCustomDomain,
  bookingCount,
}: DeleteBusinessButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="destructive" onClick={() => setIsOpen(true)}>
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </Button>

      <DeleteBusinessDialog
        businessId={businessId}
        businessName={businessName}
        hasCustomDomain={hasCustomDomain}
        bookingCount={bookingCount}
        open={isOpen}
        onClose={() => setIsOpen(false)}
        redirectAfterDelete="/admin/businesses"
      />
    </>
  );
}
