'use client';

/**
 * Date + time pair for one journey, as operating-timezone `yyyy-MM-dd` and `HH:mm` strings.
 * SCOPE: Business module ONLY.
 */

import { parse, format } from 'date-fns';
import { FormDatePicker } from '@/components/ui/form-date-picker';
import { FormTimePicker } from '@/components/ui/form-time-picker';
import { Label } from '@/components/ui/label';
import { bookingTodayAsCalendarDate } from '@/lib/business/utils/timezone';

interface DateTimeFieldsProps {
  idPrefix: string;
  date: string;
  time: string;
  dateLabel?: string;
  timeLabel?: string;
  onChange: (next: { date?: string; time?: string }) => void;
}

export function DateTimeFields({
  idPrefix,
  date,
  time,
  dateLabel = 'Pickup Date',
  timeLabel = 'Pickup Time',
  onChange,
}: DateTimeFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-date`}>{dateLabel}</Label>
        <FormDatePicker
          value={date ? parse(date, 'yyyy-MM-dd', new Date()) : undefined}
          onChange={(value) => onChange({ date: value ? format(value, 'yyyy-MM-dd') : '' })}
          disabled={(value) => value < bookingTodayAsCalendarDate()}
          placeholder="Select date"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-time`}>{timeLabel}</Label>
        <FormTimePicker value={time} onChange={(value) => onChange({ time: value })} popoverClassName="" placeholder="Select time" />
      </div>
    </div>
  );
}
