'use client';

/**
 * Date + time pair for one journey, as operating-timezone `yyyy-MM-dd` and `HH:mm` strings.
 * SCOPE: Business module ONLY.
 *
 * Nothing sooner than `leadMinutes` from now can be picked: earlier days are disabled, and on
 * the first bookable day the earlier times are too. The time waits for a date, since a time on
 * its own has nothing to attach to and would be lost.
 */

import { parse, format } from 'date-fns';
import { FormDatePicker } from '@/components/ui/form-date-picker';
import { FormTimePicker } from '@/components/ui/form-time-picker';
import { Label } from '@/components/ui/label';
import { adjustToFloor } from '@/lib/business/trips/pickup-floor';
import { bookingTodayAsCalendarDate } from '@/lib/business/utils/timezone';
import { usePickupFloor } from './use-pickup-floor';

interface DateTimeFieldsProps {
  idPrefix: string;
  date: string;
  time: string;
  /** Minutes from now before which nothing may be picked. */
  leadMinutes: number;
  dateLabel?: string;
  timeLabel?: string;
  onChange: (next: { date?: string; time?: string }) => void;
}

export function DateTimeFields({
  idPrefix,
  date,
  time,
  leadMinutes,
  dateLabel = 'Pickup Date',
  timeLabel = 'Pickup Time',
  onChange,
}: DateTimeFieldsProps) {
  const floor = usePickupFloor(leadMinutes);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-date`}>{dateLabel}</Label>
        <FormDatePicker
          value={date ? parse(date, 'yyyy-MM-dd', new Date()) : undefined}
          onChange={(value) =>
            // Choosing a date also settles the time: filled in when empty, moved up when too soon.
            onChange(value ? adjustToFloor(format(value, 'yyyy-MM-dd'), time, floor) : { date: '' })
          }
          // Compared as 'yyyy-MM-dd' strings: the calendar hands back a browser-local Date.
          disabled={(value) =>
            floor ? format(value, 'yyyy-MM-dd') < floor.date : value < bookingTodayAsCalendarDate()
          }
          placeholder="Select date"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-time`}>{timeLabel}</Label>
        <FormTimePicker
          id={`${idPrefix}-time`}
          value={time}
          onChange={(value) => onChange({ time: value })}
          minTime={floor && date === floor.date ? floor.time : undefined}
          isDisabled={!date}
          // Inside the quotation trip Sheet (z-1001, body pointer-events:none) the list would open
          // behind the panel and pass every click through. Radix copies this z-index onto the
          // portalled wrapper; pointer-events-auto takes the clicks back. A no-op on the booking page.
          popoverClassName="z-[1002] pointer-events-auto"
          placeholder={date ? 'Select time' : 'Pick a date first'}
        />
      </div>
    </div>
  );
}
