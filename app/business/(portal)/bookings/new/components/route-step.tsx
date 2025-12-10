'use client';

/**
 * Route Step Component
 * Select pickup/dropoff locations and datetime
 *
 * Design: shadcn/ui theme-aware components
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/business/(portal)/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { BookingFormData } from './booking-wizard';

interface Location {
  id: string;
  name: string;
  city: string;
}

interface RouteStepProps {
  formData: Partial<BookingFormData>;
  locations: Location[];
  onUpdate: (data: Partial<BookingFormData>) => void;
  onNext: () => void;
  onFetchVehicles: (fromLocationId: string, toLocationId: string) => Promise<void>;
}

const routeSchema = z.object({
  from_location_id: z.string().min(1, 'Pickup location is required'),
  to_location_id: z.string().min(1, 'Dropoff location is required'),
  pickup_address: z.string().min(5, 'Pickup address is required'),
  dropoff_address: z.string().min(5, 'Dropoff address is required'),
  pickup_datetime: z.string().min(1, 'Pickup date and time is required'),
});

type RouteFormData = z.infer<typeof routeSchema>;

export function RouteStep({ formData, locations, onUpdate, onNext, onFetchVehicles }: RouteStepProps) {
  const form = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      from_location_id: formData.from_location_id || '',
      to_location_id: formData.to_location_id || '',
      pickup_address: formData.pickup_address || '',
      dropoff_address: formData.dropoff_address || '',
      pickup_datetime: formData.pickup_datetime || '',
    },
  });

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
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="flex items-center gap-2 text-primary">
            <MapPin className="h-5 w-5" />
            <h3 className="font-semibold text-foreground">Pickup Details</h3>
          </div>

          <FormField
            control={form.control}
            name="from_location_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pickup Location</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select pickup location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} - {location.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

          <FormField
            control={form.control}
            name="pickup_datetime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pickup Date & Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" min={minDateTimeString} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Arrow Separator */}
        <div className="flex justify-center">
          <ArrowRight className="h-6 w-6 text-muted-foreground" />
        </div>

        {/* Dropoff Section */}
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="flex items-center gap-2 text-primary">
            <MapPin className="h-5 w-5" />
            <h3 className="font-semibold text-foreground">Dropoff Details</h3>
          </div>

          <FormField
            control={form.control}
            name="to_location_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dropoff Location</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select dropoff location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} - {location.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
          <Button type="submit">Continue to Vehicle Selection</Button>
        </div>
      </form>
    </Form>
  );
}
