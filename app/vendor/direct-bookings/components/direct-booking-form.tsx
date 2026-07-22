'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format, parse } from 'date-fns'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { FormDatePicker } from '@/components/ui/form-date-picker'
import { FormTimePicker } from '@/components/ui/form-time-picker'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { sanitizePhoneInput } from '@/lib/validation/phone'
import type { FleetAvailability, FleetOption } from '@/lib/vendor/direct-bookings/availability'
import {
  BOOKING_STATUSES,
  BOOKING_STATUS_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  directBookingFormSchema,
  type DirectBookingFormValues,
} from '@/lib/vendor/direct-bookings/schema'
import type { VendorFleetOptions } from '@/lib/vendor/direct-bookings/types'
import {
  createDirectBooking,
  getFleetAvailabilityForWindow,
  updateDirectBooking,
} from '../actions'

/** Sentinel for "not set" — Radix Select cannot hold an empty string value. */
const NONE = 'none'

/** Availability is re-queried as the vendor types; wait for them to settle first. */
const AVAILABILITY_DEBOUNCE_MS = 300

interface DirectBookingFormProps {
  fleet: VendorFleetOptions
  mode: 'create' | 'edit'
  bookingId?: string
  defaultValues?: Partial<DirectBookingFormValues>
}

/** `yyyy-MM-dd` <-> Date, so the schema can stay string-only across the action boundary. */
function toDate(value: string | undefined): Date | undefined {
  if (!value) return undefined
  const parsed = parse(value, 'yyyy-MM-dd', new Date())
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

export function DirectBookingForm({
  fleet,
  mode,
  bookingId,
  defaultValues,
}: DirectBookingFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [availability, setAvailability] = useState<FleetAvailability | null>(null)
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)

  /** Guards against a slow earlier request overwriting a newer answer. */
  const requestSeq = useRef(0)

  const form = useForm<DirectBookingFormValues>({
    resolver: zodResolver(directBookingFormSchema),
    defaultValues: {
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      customer_notes: '',
      vehicle_id: '',
      driver_id: '',
      pickup_date: format(new Date(), 'yyyy-MM-dd'),
      pickup_time: '09:00',
      return_date: format(new Date(), 'yyyy-MM-dd'),
      return_time: '11:00',
      pickup_location: '',
      dropoff_location: '',
      total_price: 0,
      amount_paid: 0,
      payment_status: 'unpaid',
      payment_method: '',
      booking_status: 'pending',
      cancellation_reason: '',
      internal_notes: '',
      ...defaultValues,
    },
  })

  const bookingStatus = form.watch('booking_status')
  const pickupDate = form.watch('pickup_date')
  const pickupTime = form.watch('pickup_time')
  const returnDate = form.watch('return_date')
  const returnTime = form.watch('return_time')

  const windowComplete = Boolean(pickupDate && pickupTime && returnDate && returnTime)

  // Availability can only be answered once the whole window exists — it is checked
  // over pickup→return, not at the pickup instant, so a booking that swallows an
  // existing one is still caught.
  useEffect(() => {
    if (!windowComplete) {
      setAvailability(null)
      setAvailabilityError(null)
      return
    }

    const seq = ++requestSeq.current
    setIsCheckingAvailability(true)

    const timer = setTimeout(async () => {
      const result = await getFleetAvailabilityForWindow(
        pickupDate,
        pickupTime,
        returnDate,
        returnTime,
        bookingId
      )

      // A newer request has already been issued — discard this answer.
      if (seq !== requestSeq.current) return

      setIsCheckingAvailability(false)

      if (result.error || !result.data) {
        setAvailabilityError(result.error ?? 'Could not check availability')
        setAvailability(null)
        return
      }

      setAvailabilityError(null)
      setAvailability(result.data)
    }, AVAILABILITY_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [windowComplete, pickupDate, pickupTime, returnDate, returnTime, bookingId])

  // If the window moves onto something the current selection cannot serve, drop the
  // selection rather than letting the vendor submit a doomed form.
  useEffect(() => {
    if (!availability) return

    const check = (field: 'vehicle_id' | 'driver_id', options: FleetOption[], noun: string) => {
      const selected = form.getValues(field)
      if (!selected) return

      const option = options.find((o) => o.id === selected)
      if (option && !option.available) {
        form.setValue(field, '', { shouldValidate: false })
        toast.warning(`${noun} no longer available`, { description: option.reason ?? undefined })
      }
    }

    check('vehicle_id', availability.vehicles, 'Vehicle')
    check('driver_id', availability.drivers, 'Driver')
  }, [availability, form])

  async function onSubmit(values: DirectBookingFormValues) {
    setIsSubmitting(true)

    try {
      const result =
        mode === 'edit' && bookingId
          ? await updateDirectBooking(bookingId, values)
          : await createDirectBooking(values)

      if (result.error) {
        toast.error(
          mode === 'edit' ? 'Could not update booking' : 'Could not create booking',
          { description: result.error }
        )
        return
      }

      toast.success(mode === 'edit' ? 'Booking updated' : 'Booking created', {
        description: `${values.customer_name} — ${values.pickup_location}`,
      })

      router.push('/vendor/direct-bookings')
      router.refresh()
    } catch (error) {
      toast.error('Something went wrong', {
        description: error instanceof Error ? error.message : 'Please try again',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (fleet.vehicles.length === 0 || fleet.drivers.length === 0) {
    const missing = fleet.vehicles.length === 0 ? 'vehicle' : 'driver'

    return (
      <Card>
        <CardHeader>
          <CardTitle>Add a {missing} first</CardTitle>
          <CardDescription>
            A direct booking needs both a vehicle and a driver from your own fleet.
            Add a {missing}, then come back.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="sm">
            <a href={missing === 'vehicle' ? '/vendor/vehicles/new' : '/vendor/drivers/new'}>
              Add {missing === 'vehicle' ? 'Vehicle' : 'Driver'}
            </a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const selectsDisabled = !windowComplete || isCheckingAvailability || !availability

  function resourcePlaceholder(noun: string): string {
    if (!windowComplete) return 'Choose pickup and return first'
    if (isCheckingAvailability) return 'Checking availability…'
    if (availabilityError) return 'Availability unavailable'
    return `Select a ${noun}`
  }

  /** Falls back to the raw fleet list before availability has been resolved. */
  function optionsFor(
    resolved: FleetOption[] | undefined,
    fallback: Array<{ id: string; label: string }>
  ): FleetOption[] {
    if (resolved) return resolved
    return fallback.map((item) => ({
      id: item.id,
      label: item.label,
      available: false,
      reason: null,
    }))
  }

  const vehicleOptions = optionsFor(
    availability?.vehicles,
    fleet.vehicles.map((v) => ({
      id: v.id,
      label: `${v.make} ${v.model}${v.year ? ` (${v.year})` : ''} — ${v.registration_number}`,
    }))
  )

  const driverOptions = optionsFor(
    availability?.drivers,
    fleet.drivers.map((d) => ({
      id: d.id,
      label: `${d.first_name} ${d.last_name} — ${d.phone}`,
    }))
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
            <CardDescription>
              Who the booking is for. These details are stored on the booking itself —
              no customer account is created.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="customer_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customer_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+971 50 123 4567"
                      {...field}
                      onChange={(e) => field.onChange(sanitizePhoneInput(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customer_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (optional)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="jane@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customer_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer notes (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Requested a child seat" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Schedule comes before Vehicle & Driver: availability cannot be answered
            until the window exists. */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule &amp; Locations</CardTitle>
            <CardDescription>
              All times are Dubai local time. Pickup and return set the window used to
              check whether a vehicle and driver are free.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="pickup_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Pickup date</FormLabel>
                  <FormControl>
                    <FormDatePicker
                      value={toDate(field.value)}
                      onChange={(date) =>
                        field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pickup_time"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Pickup time</FormLabel>
                  <FormControl>
                    <FormTimePicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="return_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Return date</FormLabel>
                  <FormControl>
                    <FormDatePicker
                      value={toDate(field.value)}
                      onChange={(date) =>
                        field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="return_time"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Return time</FormLabel>
                  <FormControl>
                    <FormTimePicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pickup_location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pickup location</FormLabel>
                  <FormControl>
                    <Input placeholder="Dubai Marina, Marina Walk" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dropoff_location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Drop-off location (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Dubai International Airport T3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle &amp; Driver</CardTitle>
            <CardDescription>
              {availabilityError
                ? availabilityError
                : windowComplete
                  ? 'Only resources free for the whole trip can be selected. Busy ones show what is blocking them.'
                  : 'Set the pickup and return times above to see what is free.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="vehicle_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={selectsDisabled}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={resourcePlaceholder('vehicle')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vehicleOptions.map((vehicle) => (
                        <SelectItem
                          key={vehicle.id}
                          value={vehicle.id}
                          disabled={!vehicle.available}
                        >
                          {vehicle.label}
                          {!vehicle.available && vehicle.reason ? ` — busy: ${vehicle.reason}` : ''}
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
              name="driver_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Driver</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={selectsDisabled}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={resourcePlaceholder('driver')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {driverOptions.map((driver) => (
                        <SelectItem
                          key={driver.id}
                          value={driver.id}
                          disabled={!driver.available}
                        >
                          {driver.label}
                          {!driver.available && driver.reason ? ` — busy: ${driver.reason}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {isCheckingAvailability ? 'Checking availability…' : ' '}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing &amp; Status</CardTitle>
            <CardDescription>
              Amounts are in AED. Payment is recorded here for your own tracking — no
              payment is processed.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="total_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total price (AED)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...field}
                      value={Number.isNaN(field.value) ? '' : field.value}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount_paid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount collected (AED)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...field}
                      value={Number.isNaN(field.value) ? '' : field.value}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {PAYMENT_STATUS_LABELS[status]}
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
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment method (optional)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === NONE ? '' : value)}
                    value={field.value || NONE}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Not recorded" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>Not recorded</SelectItem>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {PAYMENT_METHOD_LABELS[method]}
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
              name="booking_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Booking status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BOOKING_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {BOOKING_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {bookingStatus === 'cancelled' && (
              <FormField
                control={form.control}
                name="cancellation_reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cancellation reason</FormLabel>
                    <FormControl>
                      <Input placeholder="Customer cancelled" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="internal_notes"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Internal notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Only your team sees this." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'edit' ? 'Save Changes' : 'Create Booking'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => router.push('/vendor/direct-bookings')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
