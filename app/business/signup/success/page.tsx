/**
 * Business Signup Success Page
 * Shows pending approval message after successful registration
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Clock, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Registration Successful | Business Portal',
  description: 'Your business account is pending approval',
};

export default function BusinessSignupSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Registration Successful!</CardTitle>
          <CardDescription className="text-base mt-2">
            Your business account has been created and is pending approval
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status Info */}
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                  Awaiting Admin Approval
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                  Our team will review your application shortly. This usually takes 24-48 hours during
                  business days.
                </p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Mail className="h-5 w-5" />
              What happens next?
            </h3>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="font-semibold text-foreground">1.</span>
                <span>
                  Our admin team will review your business registration details
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground">2.</span>
                <span>
                  You will receive an email notification once your account is approved
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground">3.</span>
                <span>
                  After approval, you can login and start managing your transfers and bookings
                </span>
              </li>
            </ol>
          </div>

          {/* Account Details */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Your Account Status</h3>
            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  Pending Approval
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Login Access:</span>
                <span className="font-medium">Disabled (until approved)</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">
                <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                Back to Home
              </Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/business/login">
                Try Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Support Info */}
          <div className="text-center text-sm text-muted-foreground pt-2">
            <p>
              Have questions?{' '}
              <Link href="/contact" className="text-primary hover:underline">
                Contact our support team
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
