import { Metadata } from 'next'
import { Suspense } from 'react'
import { CheckoutAuthForm } from './components/checkout-auth-form'
import { PublicLayout } from '@/components/layout/public-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldCheck, Clock, CreditCard } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Login to Continue | Secure Checkout',
  description: 'Login or create an account to complete your booking',
}

interface CheckoutLoginPageProps {
  searchParams: Promise<{
    returnUrl?: string
  }>
}

export default async function CheckoutLoginPage({ searchParams }: CheckoutLoginPageProps) {
  const params = await searchParams
  const returnUrl = params.returnUrl || '/checkout'

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Secure Checkout</h1>
              <p className="text-muted-foreground">
                Please login or create an account to continue with your booking
              </p>
            </div>

            <div className="grid lg:grid-cols-5 gap-8">
              {/* Auth Form - 3 columns */}
              <div className="lg:col-span-3">
                <Suspense fallback={<div>Loading...</div>}>
                  <CheckoutAuthForm returnUrl={returnUrl} />
                </Suspense>
              </div>

              {/* Benefits - 2 columns */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Why Create an Account?</CardTitle>
                    <CardDescription>
                      Enjoy these benefits when you book with us
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-3">
                      <div className="mt-1">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Track Your Bookings</h3>
                        <p className="text-sm text-muted-foreground">
                          View all your bookings in one place and get real-time updates
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="mt-1">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Faster Checkout</h3>
                        <p className="text-sm text-muted-foreground">
                          Save your details for quicker bookings next time
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="mt-1">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Secure & Protected</h3>
                        <p className="text-sm text-muted-foreground">
                          Your information is encrypted and secure with us
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">Need Help?</p>
                      <p className="text-muted-foreground">
                        Contact our support team 24/7
                      </p>
                      <p className="text-muted-foreground">
                        Email: support@transfer.com
                      </p>
                      <p className="text-muted-foreground">
                        Phone: +1 234 567 8900
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}