import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireCustomer } from '@/lib/auth/user-actions'
import { CustomerLayout } from '@/components/layout/customer-layout'
import { AnimatedPage } from '@/components/layout/animated-page'
import { AnimatedCard } from '@/components/ui/animated-card'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StarRating } from '@/components/reviews/star-rating'
import { ArrowLeft, Edit, MapPin, Calendar, Car, Star, MessageSquare } from 'lucide-react'
import { getReviewById } from '../actions'
import { format } from 'date-fns'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export const metadata = {
  title: 'Review Details - Infinia Transfers',
  description: 'View your review details',
}

export default async function ReviewDetailPage({ params }: PageProps) {
  // Get authenticated user
  const user = await requireCustomer()

  const { id } = await params

  // Fetch review
  const { data: review, error } = await getReviewById(id)

  if (error || !review) {
    redirect('/customer/reviews')
  }

  const customerName = review.customer.full_name || review.customer.email.split('@')[0]
  const initials = customerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'pending':
        return 'outline'
      case 'approved':
        return 'secondary'
      case 'rejected':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <CustomerLayout user={user}>
      <AnimatedPage>
        <Breadcrumb
          items={[
            { label: 'My Reviews', href: '/customer/reviews' },
            { label: 'Review Details', href: `/customer/reviews/${id}` },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Review Details
            </h1>
            <p className="text-muted-foreground">View your review and feedback</p>
          </div>
          <div className="flex items-center gap-2">
            {review.status === 'pending' && (
              <Link href={`/customer/reviews/${id}/edit`}>
                <Button className="bg-luxury-gold hover:bg-luxury-gold/90 text-luxury-black gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Review
                </Button>
              </Link>
            )}
            <Link href="/customer/reviews">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Review Details - Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Review Card */}
            <AnimatedCard delay={0.1}>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={review.customer.avatar_url || undefined} />
                        <AvatarFallback className="bg-luxury-gold/20 text-luxury-gold text-lg">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <div>
                          <h3 className="text-xl font-medium">{customerName}</h3>
                          <p className="text-sm text-muted-foreground">{review.customer.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <StarRating rating={review.rating} size="md" readonly />
                          <span className="text-lg font-semibold text-luxury-gold">{review.rating}.0</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(review.created_at), 'MMMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge variant={getStatusVariant(review.status)}>
                        {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                      </Badge>
                      {review.is_featured && (
                        <Badge variant="outline">
                          <Star className="h-3 w-3 mr-1 fill-luxury-gold text-luxury-gold" />
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Review Text */}
                  {review.review_text && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Review</h4>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {review.review_text}
                      </p>
                    </div>
                  )}

                  {/* Photos */}
                  {review.photos && review.photos.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-3">Photos</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {review.photos.map((photo, index) => (
                          <div
                            key={index}
                            className="aspect-square rounded-lg overflow-hidden border hover:border-primary/50 transition-colors"
                          >
                            <img
                              src={photo}
                              alt={`Review photo ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin Response */}
                  {review.admin_response && (
                    <div className="p-4 bg-muted/50 border rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquare className="h-4 w-4 text-luxury-gold" />
                        <Badge variant="secondary">
                          Admin Response
                        </Badge>
                        {review.admin_response_at && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(review.admin_response_at), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {review.admin_response}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </AnimatedCard>
          </div>

          {/* Booking Details - Sidebar */}
          <div className="space-y-6">
            <AnimatedCard delay={0.2}>
              <Card>
                <CardHeader>
                  <CardTitle>Booking Details</CardTitle>
                  <CardDescription>
                    Service information for this review
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Booking Number */}
                  {review.booking && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Booking Number</p>
                      <Badge variant="secondary" className="font-mono">
                        {review.booking.booking_number}
                      </Badge>
                    </div>
                  )}

                  {/* Route */}
                  {review.route_from && review.route_to && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Route</p>
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 mt-0.5 text-luxury-gold flex-shrink-0" />
                        <div>
                          <p className="font-medium">{review.route_from}</p>
                          <p className="text-muted-foreground text-xs my-1">to</p>
                          <p className="font-medium">{review.route_to}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Vehicle */}
                  {review.vehicle_class && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Vehicle</p>
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-luxury-gold" />
                        <span>{review.vehicle_class}</span>
                      </div>
                    </div>
                  )}

                  {/* Date */}
                  {review.booking && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Service Date</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-luxury-gold" />
                        <span>
                          {format(new Date(review.booking.pickup_datetime), 'MMMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </AnimatedCard>
          </div>
        </div>
      </AnimatedPage>
    </CustomerLayout>
  )
}
