'use client';

/**
 * Checkout Success Handler
 * Verifies Stripe Checkout payment and updates wallet balance
 * Triggered when user returns from Checkout with success=true&session_id=xxx
 */

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function CheckoutSuccessHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);

  // Track processed sessions to prevent duplicate API calls
  const processedSessions = useRef<Set<string>>(new Set());

  useEffect(() => {
    const verifyPayment = async () => {
      // Check if this is a checkout success redirect
      const success = searchParams.get('success');
      const sessionId = searchParams.get('session_id');

      // Early exits to prevent duplicate processing
      if (!success || !sessionId) {
        // Handle cancelled checkout
        const cancelled = searchParams.get('cancelled');
        if (cancelled === 'true' && !processedSessions.current.has('cancelled')) {
          processedSessions.current.add('cancelled');
          toast.info('Checkout Cancelled', {
            description: 'You cancelled the checkout process.',
          });

          // Clean URL
          const url = new URL(window.location.href);
          url.searchParams.delete('cancelled');
          router.replace(url.pathname, { scroll: false });
        }
        return;
      }

      if (success !== 'true') return;
      if (isVerifying) return; // Already verifying
      if (processedSessions.current.has(sessionId)) return; // Already processed in this render cycle

      // Check sessionStorage for previously processed sessions (persists across page refreshes)
      const storageKey = `checkout_verified_${sessionId}`;
      if (typeof window !== 'undefined' && sessionStorage.getItem(storageKey)) {
        // Already processed, just clean URL silently
        const url = new URL(window.location.href);
        url.searchParams.delete('success');
        url.searchParams.delete('session_id');
        router.replace(url.pathname, { scroll: false });
        return;
      }

      // Mark as processing to prevent duplicate calls
      processedSessions.current.add(sessionId);
      setIsVerifying(true);

      // Clean URL immediately (before API call) to prevent re-triggering
      const url = new URL(window.location.href);
      url.searchParams.delete('success');
      url.searchParams.delete('session_id');
      router.replace(url.pathname, { scroll: false });

      try {
        // Call verification API
        const response = await fetch(`/api/business/wallet/verify-payment?session_id=${sessionId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();

        if (response.ok && result.data) {
          const { message, new_balance, amount_added, already_processed } = result.data;

          // Mark as verified in sessionStorage
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(storageKey, 'true');
          }

          // Show success toast (only once)
          if (already_processed) {
            toast.success('Payment Already Processed', {
              description: `Your wallet balance is $${new_balance.toFixed(2)}`,
            });
          } else {
            toast.success('Payment Successful!', {
              description: `$${amount_added.toFixed(2)} has been added to your wallet. New balance: $${new_balance.toFixed(2)}`,
            });
          }

          // Refresh the page to show updated balance
          router.refresh();
        } else {
          // Handle error
          const errorMessage = result.error || 'Failed to verify payment';
          toast.error('Verification Failed', {
            description: errorMessage,
          });
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        toast.error('Verification Error', {
          description: 'Failed to verify payment. Please contact support if funds were deducted.',
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams]); // Only depend on searchParams

  // Show loading indicator while verifying
  if (isVerifying) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-8 shadow-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">
            <p className="font-medium text-foreground">Verifying Payment...</p>
            <p className="text-sm text-muted-foreground">Please wait while we confirm your payment</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
