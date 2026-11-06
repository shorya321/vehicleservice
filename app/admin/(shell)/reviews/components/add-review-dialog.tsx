'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Star } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { ADMIN_REVIEW_SOURCES, type AdminReviewSource } from '@/lib/reviews/sources'
import { adminReviewSchema } from '@/lib/reviews/admin-review-schema'
import { createAdminReview } from '../add-review-actions'

interface AddReviewDialogProps {
  /** Today in the operating timezone, from the server, as yyyy-MM-dd. */
  today: string
}

interface FormState {
  reviewerName: string
  rating: number
  reviewText: string
  source: AdminReviewSource | ''
  vehicleClass: string
  routeFrom: string
  routeTo: string
  reviewDate: string
  publish: boolean
  isFeatured: boolean
}

const emptyForm = (today: string): FormState => ({
  reviewerName: '',
  rating: 0,
  reviewText: '',
  source: '',
  vehicleClass: '',
  routeFrom: '',
  routeTo: '',
  reviewDate: today,
  publish: true,
  isFeatured: false,
})

/**
 * Admin form for feedback a traveller gave outside the site. The source is
 * required and is shown on the public card, so a typed-in review is never
 * presented as one left on the site.
 */
export function AddReviewDialog({ today }: AddReviewDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(() => emptyForm(today))
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const set = <K extends keyof FormState>(key: K, value: FormState[K]): void =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const submit = (): void => {
    setError(null)
    const parsed = adminReviewSchema.safeParse(form)
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Check the form and try again')
      return
    }
    if (form.reviewDate > today) {
      setError('The review date cannot be in the future')
      return
    }

    startTransition(async () => {
      // Validated above, so the source is one of the listed values.
      const result = await createAdminReview({ ...form, source: form.source as AdminReviewSource })
      if (!result.success) {
        setError(result.error)
        return
      }
      toast.success(form.publish ? 'Review added and published' : 'Review added as pending')
      setForm(emptyForm(today))
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setError(null)
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Add review
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add a review</DialogTitle>
          <DialogDescription>
            For feedback a traveller gave you by WhatsApp, email, phone, Google or in person. Enter their words as
            they wrote them. The card on the site shows where it came from.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="add-review-name">Traveller name</Label>
              <Input
                id="add-review-name"
                value={form.reviewerName}
                onChange={(e) => set('reviewerName', e.target.value)}
                placeholder="e.g. Sara Ahmed"
                maxLength={80}
                required
              />
              <p className="text-xs text-muted-foreground">The site shows first name and last initial only.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-review-source">Where it came from</Label>
              <Select value={form.source} onValueChange={(value) => set('source', value as AdminReviewSource)}>
                <SelectTrigger id="add-review-source">
                  <SelectValue placeholder="Pick a source" />
                </SelectTrigger>
                <SelectContent>
                  {ADMIN_REVIEW_SOURCES.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Rating</legend>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('rating', value)}
                  aria-label={`${value} star${value === 1 ? '' : 's'}`}
                  aria-pressed={form.rating === value}
                  className="rounded p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Star
                    className={cn(
                      'h-7 w-7',
                      value <= form.rating ? 'fill-[var(--gold)] text-[var(--gold)]' : 'text-muted-foreground'
                    )}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="add-review-text">What they said</Label>
            <Textarea
              id="add-review-text"
              value={form.reviewText}
              onChange={(e) => set('reviewText', e.target.value)}
              rows={5}
              maxLength={1000}
              required
            />
            <p className="text-right text-xs text-muted-foreground">{form.reviewText.length}/1000</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="add-review-vehicle">Vehicle (optional)</Label>
              <Input
                id="add-review-vehicle"
                value={form.vehicleClass}
                onChange={(e) => set('vehicleClass', e.target.value)}
                placeholder="e.g. Business Class"
                maxLength={60}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-review-from">From (optional)</Label>
              <Input
                id="add-review-from"
                value={form.routeFrom}
                onChange={(e) => set('routeFrom', e.target.value)}
                placeholder="e.g. Dubai Intl (DXB)"
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-review-to">To (optional)</Label>
              <Input
                id="add-review-to"
                value={form.routeTo}
                onChange={(e) => set('routeTo', e.target.value)}
                placeholder="e.g. Dubai Marina"
                maxLength={120}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="add-review-date">Date of feedback</Label>
              <Input
                id="add-review-date"
                type="date"
                value={form.reviewDate}
                max={today}
                onChange={(e) => set('reviewDate', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-3 rounded-md border p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="add-review-publish">Publish now</Label>
                <p className="text-xs text-muted-foreground">Off saves it as pending, to approve later.</p>
              </div>
              <Switch
                id="add-review-publish"
                checked={form.publish}
                onCheckedChange={(checked) => {
                  set('publish', checked)
                  if (!checked) set('isFeatured', false)
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="add-review-featured">Feature on homepage</Label>
                <p className="text-xs text-muted-foreground">Featured reviews fill the homepage cards first.</p>
              </div>
              <Switch
                id="add-review-featured"
                checked={form.isFeatured}
                disabled={!form.publish}
                onCheckedChange={(checked) => set('isFeatured', checked)}
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              Save review
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
