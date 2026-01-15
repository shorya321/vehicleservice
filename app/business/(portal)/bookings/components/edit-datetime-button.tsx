'use client';

/**
 * Edit DateTime Button Component
 * Button that opens the edit datetime modal if booking is eligible
 */

import { useState } from 'react';
import { Pencil, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { EditDateTimeModal } from './edit-datetime-modal';
import {
  canModifyBookingDateTime,
  getModificationEligibility,
} from '@/lib/business/booking-utils';

interface EditDateTimeButtonProps {
  bookingId: string;
  bookingNumber: string;
  bookingStatus: string;
  pickupDatetime: string;
  onSuccess?: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'icon';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function EditDateTimeButton({
  bookingId,
  bookingNumber,
  bookingStatus,
  pickupDatetime,
  onSuccess,
  variant = 'outline',
  size = 'sm',
}: EditDateTimeButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canModify = canModifyBookingDateTime({
    booking_status: bookingStatus,
    pickup_datetime: pickupDatetime,
  });

  const eligibility = getModificationEligibility({
    booking_status: bookingStatus,
    pickup_datetime: pickupDatetime,
  });

  // Icon-only variant for table rows
  if (variant === 'icon' || size === 'icon') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={!canModify}
              onClick={() => setIsModalOpen(true)}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit pickup time</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            {canModify ? 'Edit pickup date/time' : eligibility.reason}
          </TooltipContent>
        </Tooltip>

        <EditDateTimeModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          bookingId={bookingId}
          bookingNumber={bookingNumber}
          currentDatetime={pickupDatetime}
          onSuccess={onSuccess}
        />
      </TooltipProvider>
    );
  }

  // Standard button variant
  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                variant={variant}
                size={size}
                disabled={!canModify}
                onClick={() => setIsModalOpen(true)}
                className="gap-2"
              >
                <Clock className="h-4 w-4" />
                Edit Date/Time
              </Button>
            </span>
          </TooltipTrigger>
          {!canModify && (
            <TooltipContent side="top" className="max-w-xs">
              {eligibility.reason}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      <EditDateTimeModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        bookingId={bookingId}
        bookingNumber={bookingNumber}
        currentDatetime={pickupDatetime}
        onSuccess={onSuccess}
      />
    </>
  );
}
