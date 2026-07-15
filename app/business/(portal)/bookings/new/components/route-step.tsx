'use client';

/**
 * Route Step Component
 * Select pickup/dropoff locations and datetime
 *
 * Design: shadcn/ui theme-aware components
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, ArrowDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormDatePicker } from '@/components/ui/form-date-picker';
import { FormTimePicker } from '@/components/ui/form-time-picker';
import { parse, format } from 'date-fns';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { BookingFormData } from './booking-wizard';
import { LocationSearchAutocomplete } from '@/components/search/location-search-autocomplete';
import type { LocationSearchResult } from '@/lib/types/location';

interface RouteStepProps {
  formData: Partial<BookingFormData>;
  onUpdate: (data: Partial<BookingFormData>) => void;
  onNext: () => void;
  onFetchVehicles: (fromLocationId: string, toLocationId: string) => Promise<void>;
}

type RouteFormData = z.infer<typeof routeSchema>;

const routeSchema = z.object({
  from_location_id: z.string().min(1, 'Pickup location is required'),
  to_location_id: z.string().min(1, 'Dropoff location is required'),
  pickup_address: z.string().min(5, 'Pickup address is required'),
  dropoff_address: z.string().min(5, 'Dropoff address is required'),
  pickup_datetime: z.string().min(1, 'Pickup date and time is required'),
  passenger_count: z.number().int().min(1).max(20),
});

export function RouteStep({ formData, onUpdate, onNext, onFetchVehicles }: RouteStepProps) {
  const form = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      from_location_id: formData.from_location_id || '',
      to_location_id: formData.to_location_id || '',
      pickup_address: formData.pickup_address || '',
      dropoff_address: formData.dropoff_address || '',
      pickup_datetime: formData.pickup_datetime || '',
      passenger_count: formData.passenger_count || 1,
    },
  });

  const [fromInput, setFromInput] = useState(formData.from_location_name || '');
  const [toInput, setToInput] = useState(formData.to_location_name || '');

  async function onSubmit(values: RouteFormData) {
    onUpdate(values);

    // Fetch available vehicles for selected route
    await onFetchVehicles(values.from_location_id, values.to_location_id);

    onNext();
  }

  // Get minimum datetime (now + 2 hours)
  const minDateTime = new Date();
  minDateTime.setHours(minDateTime.getHours() + 2);
  const minDateTimeString = minDateTime.toISOString().slice(0, 16);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Pickup Section */}
        <div className="space-y-4 p-5 border border-border rounded-xl bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <MapPin className="h-5 w-5 text-emerald-500" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Pickup Details</h3>
          </div>

          <FormField
            control={form.control}
            name="from_location_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pickup Location</FormLabel>
                <FormControl>
                  <LocationSearchAutocomplete
                    value={fromInput}
                    onChange={setFromInput}
                    onSelect={(loc: LocationSearchResult) => {
                      field.onChange(loc.id);
                      setFromInput(loc.name);
                      onUpdate({ from_location_name: loc.name });
                    }}
                    placeholder="Search pickup location..."
                    id="from-location"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pickup_address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pickup Address</FormLabel>
                <FormControl>
                  <Input placeholder="123 Main St, Hotel Entrance" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="pickup_datetime"
              render={({ field }) => {
                const dateValue = field.value ? field.value.split('T')[0] : '';
                const timeValue = field.value ? field.value.split('T')[1] || '' : '';
                return (
                  <FormItem>
                    <FormLabel>Pickup Date</FormLabel>
                    <FormControl>
                      <FormDatePicker
                        value={dateValue ? parse(dateValue, 'yyyy-MM-dd', new Date()) : undefined}
                        onChange={(date) => {
                          const d = date ? format(date, 'yyyy-MM-dd') : '';
                          field.onChange(d && timeValue ? `${d}T${timeValue}` : d ? `${d}T12:00` : '');
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        placeholder="Select date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="pickup_datetime"
              render={({ field }) => {
                const dateValue = field.value ? field.value.split('T')[0] : '';
                const timeValue = field.value ? field.value.split('T')[1] || '' : '';
                return (
                  <FormItem>
                    <FormLabel>Pickup Time</FormLabel>
                    <FormControl>
                      <FormTimePicker
                        value={timeValue}
                        onChange={(time) => {
                          field.onChange(dateValue ? `${dateValue}T${time}` : '');
                        }}
                        popoverClassName=""
                        placeholder="Select time"
                      />
                    </FormControl>
                  </FormItem>
                );
              }}
            />
          </div>

          <FormField
            control={form.control}
            name="passenger_count"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Guest</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Arrow Separator */}
        <div className="flex justify-center">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 border border-primary/20">
            <ArrowDown className="h-5 w-5 text-primary" />
          </div>
        </div>

        {/* Dropoff Section */}
        <div className="space-y-4 p-5 border border-border rounded-xl bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
              <MapPin className="h-5 w-5 text-rose-500" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Dropoff Details</h3>
          </div>

          <FormField
            control={form.control}
            name="to_location_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dropoff Location</FormLabel>
                <FormControl>
                  <LocationSearchAutocomplete
                    value={toInput}
                    onChange={setToInput}
                    onSelect={(loc: LocationSearchResult) => {
                      field.onChange(loc.id);
                      setToInput(loc.name);
                      onUpdate({ to_location_name: loc.name });
                    }}
                    placeholder="Search dropoff location..."
                    id="to-location"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dropoff_address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dropoff Address</FormLabel>
                <FormControl>
                  <Input placeholder="456 Airport Blvd, Terminal 1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading Vehicles…
              </>
            ) : (
              'Continue to Vehicle Selection'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
