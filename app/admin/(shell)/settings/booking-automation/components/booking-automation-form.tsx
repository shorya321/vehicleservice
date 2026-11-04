'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Clock, Loader2, Play, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { StatusPill } from '@/components/admin/ui/status-pill'
import { bookingAutomationSchema, type BookingAutomationValues } from '@/lib/bookings/automation-schema'
import { formatBookingDateTime } from '@/lib/utils/timezone'
import type { BookingAutomationStatus } from '@/lib/bookings/automation-status'
import { runUnpaidExpiryNow, updateBookingAutomation } from '../actions'

interface BookingAutomationFormProps {
  status: BookingAutomationStatus
}

export function BookingAutomationForm({ status }: BookingAutomationFormProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)
  const form = useForm<BookingAutomationValues>({
    resolver: zodResolver(bookingAutomationSchema),
    defaultValues: { enabled: status.enabled, minutes: status.minutes },
  })

  async function onSubmit(next: BookingAutomationValues): Promise<void> {
    setSaving(true)
    try {
      const result = await updateBookingAutomation(next)
      if (!result.success) {
        toast.error(result.error ?? 'Could not save settings')
        return
      }
      toast.success('Booking automation saved')
      form.reset(next)
      startTransition(() => router.refresh())
    } catch {
      toast.error('Could not save settings. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  async function onRunNow(): Promise<void> {
    setRunning(true)
    try {
      const result = await runUnpaidExpiryNow()
      if (!result.success) {
        toast.error(result.error ?? 'The job could not run')
        return
      }
      const count = result.expired ?? 0
      toast.success(count === 0 ? 'Nothing to expire' : `${count} unpaid booking${count === 1 ? '' : 's'} expired`)
      startTransition(() => router.refresh())
    } catch {
      toast.error('The job could not run. Check your connection and try again.')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Unpaid checkouts</CardTitle>
              <CardDescription>
                Applies to customer bookings only. Bookings with a vendor assigned and business bookings are never
                touched. A customer who pays after the limit still gets their booking confirmed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4">
                    <div className="space-y-1">
                      <FormLabel>Automatically expire unpaid bookings</FormLabel>
                      <FormDescription>When off, unpaid bookings stay open until you close them.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Automatically expire unpaid bookings" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minutes"
                render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel>Expire after (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" inputMode="numeric" min={15} max={1440} step={1} {...field} />
                    </FormControl>
                    <FormDescription>Between 15 and 1440 (24 hours). Default 60.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>

      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
          <CardDescription>
            The job runs inside the database, so it keeps working wherever the website is hosted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <dt className="text-sm text-muted-foreground">Database job</dt>
              <dd className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {status.schedule ? (
                  <>
                    Every 5 minutes
                    <StatusPill tone={status.schedule.active ? 'success' : 'warning'}>
                      {status.schedule.active ? 'Active' : 'Paused'}
                    </StatusPill>
                  </>
                ) : (
                  <StatusPill tone="warning">Not installed</StatusPill>
                )}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-sm text-muted-foreground">Waiting for payment now</dt>
              <dd className="text-sm font-medium tabular-nums">{status.awaitingPayment}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-sm text-muted-foreground">Last run</dt>
              <dd className="text-sm font-medium">
                {status.lastRunAt ? formatBookingDateTime(status.lastRunAt) : 'Not run yet'}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-sm text-muted-foreground">Expired in last run</dt>
              <dd className="text-sm font-medium tabular-nums">{status.lastRunExpired ?? 0}</dd>
            </div>
          </dl>
          {status.error && <p className="text-sm text-muted-foreground">{status.error}</p>}
          <div className="flex justify-end border-t pt-4">
            <Button type="button" variant="outline" onClick={onRunNow} disabled={running}>
              {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              Run now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
