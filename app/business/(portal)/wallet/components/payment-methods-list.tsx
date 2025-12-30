'use client';

/**
 * Payment Methods List Component
 * Displays and manages saved payment methods
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { PaymentMethodCard } from './payment-method-card';
import { staggerContainer, staggerItem } from '@/lib/business/animation/variants';
import { useReducedMotion } from '@/lib/business/animation/hooks';
import { cn } from '@/lib/utils';

interface PaymentMethod {
  id: string;
  stripe_payment_method_id: string;
  payment_method_type: string;
  card_brand?: string;
  card_last4?: string;
  card_exp_month?: number;
  card_exp_year?: number;
  card_funding?: string;
  is_default: boolean;
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
}

export function PaymentMethodsList() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/business/wallet/payment-element/payment-methods');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load payment methods');
      }

      // API wraps response in { data: { payment_methods } }
      setPaymentMethods(result.data?.payment_methods || []);
    } catch (error) {
      console.error('Load payment methods error:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      setSettingDefaultId(paymentMethodId);

      const response = await fetch('/api/business/wallet/payment-element/payment-methods', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_method_id: paymentMethodId,
          set_as_default: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set default payment method');
      }

      toast.success('Default payment method updated');
      loadPaymentMethods();
      router.refresh();
    } catch (error) {
      console.error('Set default error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to set default payment method');
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleDelete = async (paymentMethodId: string) => {
    try {
      setDeletingId(paymentMethodId);

      const response = await fetch(
        `/api/business/wallet/payment-element/payment-methods?id=${paymentMethodId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete payment method');
      }

      toast.success('Payment method deleted');
      loadPaymentMethods();
      router.refresh();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete payment method');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card border border-border rounded-xl shadow-sm h-full">
        <CardContent className="flex items-center justify-center py-12">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (paymentMethods.length === 0) {
    return (
      <Card className="bg-card border border-border rounded-xl shadow-sm h-full">
        <CardHeader className="p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              PAYMENT METHODS
            </CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="text-foreground font-medium">0</span> cards saved
          </p>
        </CardHeader>
        <CardContent className="p-5">
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 ring-2 ring-primary/20 flex items-center justify-center mb-4">
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Payment methods will be saved automatically when you make a wallet recharge.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const listContent = paymentMethods.map((pm) => (
    <PaymentMethodCard
      key={pm.id}
      paymentMethod={pm}
      onSetDefault={handleSetDefault}
      onDelete={handleDelete}
      isSettingDefault={settingDefaultId === pm.id}
      isDeleting={deletingId === pm.id}
    />
  ));

  return (
    <Card className="bg-card border border-border rounded-xl shadow-sm h-full">
      <CardHeader className="p-5 border-b border-border">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            PAYMENT METHODS
          </CardTitle>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          <span className="text-foreground font-medium">{paymentMethods.length}</span> {paymentMethods.length === 1 ? 'card' : 'cards'} saved
        </p>
      </CardHeader>
      <CardContent className="p-5">
        {prefersReducedMotion ? (
          <div className="space-y-3">{listContent}</div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {paymentMethods.map((pm) => (
              <motion.div key={pm.id} variants={staggerItem}>
                <PaymentMethodCard
                  paymentMethod={pm}
                  onSetDefault={handleSetDefault}
                  onDelete={handleDelete}
                  isSettingDefault={settingDefaultId === pm.id}
                  isDeleting={deletingId === pm.id}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
