'use client';

/**
 * Bookings Table Component
 * Display bookings in a table format
 */

import Link from 'next/link';
import { CalendarCheck, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/business/wallet-operations';

interface Booking {
  id: string;
  booking_number: string;
  customer_name: string;
  customer_email: string;
  pickup_datetime: string;
  booking_status: string;
  total_price: number;
  from_locations: { name: string; city: string };
  to_locations: { name: string; city: string };
  vehicle_types: { name: string };
  created_at: string;
}

interface BookingsTableProps {
  bookings: Booking[];
}

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { label: string; variant: any }> = {
    pending: { label: 'Pending', variant: 'secondary' },
    confirmed: { label: 'Confirmed', variant: 'default' },
    assigned: { label: 'Assigned', variant: 'default' },
    in_progress: { label: 'In Progress', variant: 'default' },
    completed: { label: 'Completed', variant: 'success' },
    cancelled: { label: 'Cancelled', variant: 'destructive' },
    refunded: { label: 'Refunded', variant: 'outline' },
  };

  const config = statusConfig[status] || { label: status, variant: 'outline' };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function BookingsTable({ bookings }: BookingsTableProps) {
  if (!bookings || bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CalendarCheck className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No bookings yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create your first booking to get started
        </p>
        <Button asChild>
          <Link href="/business/bookings/new">Create Booking</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Booking #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Route</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Pickup</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell className="font-medium">{booking.booking_number}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{booking.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{booking.customer_email}</p>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <p>{booking.from_locations.name}</p>
                  <p className="text-muted-foreground">→ {booking.to_locations.name}</p>
                </div>
              </TableCell>
              <TableCell>{booking.vehicle_types.name}</TableCell>
              <TableCell>
                <div className="text-sm">
                  <p>{new Date(booking.pickup_datetime).toLocaleDateString('en-US')}</p>
                  <p className="text-muted-foreground">
                    {new Date(booking.pickup_datetime).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </p>
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(booking.booking_status)}</TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(booking.total_price)}
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/business/bookings/${booking.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
