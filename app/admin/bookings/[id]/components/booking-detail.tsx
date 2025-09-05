'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  Calendar, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Car, 
  Users, 
  Luggage,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign
} from 'lucide-react'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import { updateBookingStatus, updatePaymentStatus } from '../../actions'
import { toast } from 'sonner'

interface BookingDetailProps {
  booking: any // We'll define proper types later
}

export function BookingDetail({ booking }: BookingDetailProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [statusToUpdate, setStatusToUpdate] = useState<'confirmed' | 'completed' | 'cancelled' | null>(null)
  const [paymentStatusToUpdate, setPaymentStatusToUpdate] = useState<'completed' | 'failed' | 'refunded' | null>(null)

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      confirmed: { variant: 'default' as const, icon: CheckCircle },
      completed: { variant: 'secondary' as const, icon: CheckCircle },
      cancelled: { variant: 'destructive' as const, icon: XCircle },
      pending: { variant: 'outline' as const, icon: Clock },
    }
    
    const config = variants[status] || variants.pending
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-500' },
      processing: { variant: 'secondary' as const, icon: Clock, color: 'text-blue-500' },
      failed: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-500' },
      refunded: { variant: 'outline' as const, icon: AlertCircle, color: 'text-orange-500' },
      pending: { variant: 'outline' as const, icon: Clock, color: 'text-gray-500' },
    }
    
    const config = variants[status] || variants.pending
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const handleStatusUpdate = async () => {
    if (!statusToUpdate) return
    
    setIsUpdating(true)
    try {
      await updateBookingStatus(booking.id, statusToUpdate)
      toast.success(`Booking status updated to ${statusToUpdate}`)
      router.refresh()
    } catch (error) {
      toast.error('Failed to update booking status')
    } finally {
      setIsUpdating(false)
      setStatusToUpdate(null)
    }
  }

  const handlePaymentStatusUpdate = async () => {
    if (!paymentStatusToUpdate) return
    
    setIsUpdating(true)
    try {
      await updatePaymentStatus(booking.id, paymentStatusToUpdate)
      toast.success(`Payment status updated to ${paymentStatusToUpdate}`)
      router.refresh()
    } catch (error) {
      toast.error('Failed to update payment status')
    } finally {
      setIsUpdating(false)
      setPaymentStatusToUpdate(null)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Content - Left Side */}
      <div className="lg:col-span-2 space-y-6">
        {/* Booking Information */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Information</CardTitle>
            <CardDescription>Core booking details and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Booking Number</p>
                <p className="font-mono text-lg font-semibold">{booking.booking_number}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-sm text-muted-foreground">Status</p>
                {getStatusBadge(booking.booking_status)}
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Pickup Date & Time</p>
                  <p className="font-medium">
                    {format(new Date(booking.pickup_datetime), 'PPP')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(booking.pickup_datetime), 'p')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Passengers & Luggage</p>
                  <p className="font-medium">
                    {booking.passenger_count} Passengers
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {booking.luggage_count || 0} Pieces of Luggage
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-1 flex-1">
                  <p className="text-sm text-muted-foreground">Pickup Location</p>
                  <p className="font-medium">{booking.pickup_address}</p>
                  {booking.from_zone?.name && (
                    <p className="text-sm text-muted-foreground">Zone: {booking.from_zone.name}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-1 flex-1">
                  <p className="text-sm text-muted-foreground">Dropoff Location</p>
                  <p className="font-medium">{booking.dropoff_address}</p>
                  {booking.to_zone?.name && (
                    <p className="text-sm text-muted-foreground">Zone: {booking.to_zone.name}</p>
                  )}
                </div>
              </div>
            </div>

            {booking.customer_notes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Customer Notes</p>
                  <p className="text-sm">{booking.customer_notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Information */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
            <CardDescription>Assigned vehicle type details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                <Car className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <p className="font-semibold">{booking.vehicle_type?.name || 'N/A'}</p>
                  {booking.vehicle_type?.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {booking.vehicle_type.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Up to {booking.vehicle_type?.passenger_capacity || 0} passengers
                  </span>
                  <span className="flex items-center gap-1">
                    <Luggage className="h-3 w-3" />
                    {booking.vehicle_type?.luggage_capacity || 0} luggage
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Passengers */}
        {booking.booking_passengers && booking.booking_passengers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Passenger Information</CardTitle>
              <CardDescription>Details of all passengers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {booking.booking_passengers.map((passenger: any, index: number) => (
                  <div key={passenger.id} className="flex items-start justify-between p-3 rounded-lg border">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {passenger.first_name} {passenger.last_name}
                        </p>
                        {passenger.is_primary && (
                          <Badge variant="secondary" className="text-xs">Primary</Badge>
                        )}
                      </div>
                      {passenger.email && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {passenger.email}
                        </p>
                      )}
                      {passenger.phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {passenger.phone}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar - Right Side */}
      <div className="space-y-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={booking.customer?.avatar_url} />
                <AvatarFallback>
                  {booking.customer?.full_name?.slice(0, 2).toUpperCase() || 'UN'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{booking.customer?.full_name || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">
                  {booking.customer?.role?.charAt(0).toUpperCase() + booking.customer?.role?.slice(1)}
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              {booking.customer?.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.customer.email}</span>
                </div>
              )}
              {booking.customer?.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.customer.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Status: {booking.customer?.status || 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              {getPaymentStatusBadge(booking.payment_status || 'pending')}
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Base Price</span>
                <span className="font-medium">{formatCurrency(booking.base_price)}</span>
              </div>
              {booking.amenities_price > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amenities</span>
                  <span className="font-medium">{formatCurrency(booking.amenities_price)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold">Total Amount</span>
                <span className="font-bold text-lg">{formatCurrency(booking.total_price)}</span>
              </div>
            </div>

            {booking.stripe_payment_intent_id && (
              <>
                <Separator />
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">Payment Intent</p>
                  <p className="font-mono text-xs break-all">{booking.stripe_payment_intent_id}</p>
                </div>
              </>
            )}

            {booking.paid_at && (
              <>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid At</span>
                  <span>{format(new Date(booking.paid_at), 'PPp')}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Update Booking Status</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStatusToUpdate('confirmed')}
                  disabled={booking.booking_status === 'confirmed' || isUpdating}
                >
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStatusToUpdate('completed')}
                  disabled={booking.booking_status === 'completed' || isUpdating}
                >
                  Complete
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStatusToUpdate('cancelled')}
                  disabled={booking.booking_status === 'cancelled' || isUpdating}
                >
                  Cancel
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium">Update Payment Status</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPaymentStatusToUpdate('completed')}
                  disabled={booking.payment_status === 'completed' || isUpdating}
                >
                  Paid
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPaymentStatusToUpdate('failed')}
                  disabled={booking.payment_status === 'failed' || isUpdating}
                >
                  Failed
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPaymentStatusToUpdate('refunded')}
                  disabled={booking.payment_status === 'refunded' || isUpdating}
                >
                  Refund
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Update Confirmation Dialog */}
      <AlertDialog open={!!statusToUpdate} onOpenChange={() => setStatusToUpdate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Booking Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update this booking status to "{statusToUpdate}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusUpdate}>
              Update Status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Status Update Confirmation Dialog */}
      <AlertDialog open={!!paymentStatusToUpdate} onOpenChange={() => setPaymentStatusToUpdate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Payment Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update the payment status to "{paymentStatusToUpdate}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePaymentStatusUpdate}>
              Update Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}