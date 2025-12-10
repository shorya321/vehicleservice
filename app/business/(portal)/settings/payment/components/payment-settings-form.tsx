'use client';

/**
 * Payment Settings Form Component
 * Allows business owners to configure payment-related settings
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/business/(portal)/components/ui/select';
import { Loader2, Save, CreditCard, DollarSign, ShieldCheck, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getCurrencyOptions, type CurrencyCode } from '@/lib/utils/currency-converter';

interface PaymentSettings {
  save_payment_methods: boolean;
  payment_element_enabled: boolean;
  preferred_currency: CurrencyCode;
}

interface PaymentSettingsFormProps {
  initialSettings: PaymentSettings;
}

export function PaymentSettingsForm({ initialSettings }: PaymentSettingsFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<PaymentSettings>(initialSettings);

  const currencies = getCurrencyOptions();

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const response = await fetch('/api/business/settings/payment', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update settings');
      }

      toast.success('Payment settings updated successfully');
      router.refresh();
    } catch (error) {
      console.error('Save settings error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    settings.save_payment_methods !== initialSettings.save_payment_methods ||
    settings.payment_element_enabled !== initialSettings.payment_element_enabled ||
    settings.preferred_currency !== initialSettings.preferred_currency;

  return (
    <div className="space-y-6">
      {/* Payment Methods Card */}
      <Card className="bg-card border border-border rounded-xl shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Payment Methods
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Configure how payment methods are saved and managed for your business
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Save Payment Methods Toggle */}
          <div className="flex items-center justify-between rounded-xl bg-muted border border-border p-4">
            <div className="space-y-1 flex-1 max-w-2xl">
              <Label htmlFor="save-payment-methods" className="text-foreground font-medium">
                Save Payment Methods Automatically
              </Label>
              <p className="text-sm text-muted-foreground">
                Automatically save payment methods after successful payments. This enables faster
                future transactions and allows auto-recharge functionality. Payment methods are
                securely stored with Stripe.
              </p>
            </div>
            <Switch
              id="save-payment-methods"
              checked={settings.save_payment_methods}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, save_payment_methods: checked }))
              }
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>

          {/* Payment Element Toggle */}
          <div className="flex items-center justify-between rounded-xl bg-muted border border-border p-4">
            <div className="space-y-1 flex-1 max-w-2xl">
              <Label htmlFor="payment-element" className="text-foreground font-medium">
                Enable Instant Payment
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable the instant payment option with Stripe Payment Element. Users can enter their
                card details directly on your site for immediate payment. If disabled, only the
                Checkout flow will be available.
              </p>
            </div>
            <Switch
              id="payment-element"
              checked={settings.payment_element_enabled}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, payment_element_enabled: checked }))
              }
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Currency Settings Card */}
      <Card className="bg-card border border-border rounded-xl shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Currency Settings
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Select your preferred currency for wallet transactions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label htmlFor="preferred-currency" className="text-foreground">
              Preferred Currency
            </Label>
            <Select
              value={settings.preferred_currency}
              onValueChange={(value: CurrencyCode) =>
                setSettings((prev) => ({ ...prev, preferred_currency: value }))
              }
            >
              <SelectTrigger
                id="preferred-currency"
                className="max-w-xs bg-muted border-border text-foreground focus:ring-primary/20 focus:border-primary"
              >
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {currencies.map((currency) => (
                  <SelectItem
                    key={currency.code}
                    value={currency.code}
                    className="text-foreground focus:bg-primary/10 focus:text-foreground"
                  >
                    {currency.code} - {currency.name} ({currency.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              This currency will be used for wallet balance display and pricing. All transactions
              will be processed in this currency unless converted by Stripe.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security Info Card */}
      <Card className="bg-card border border-border rounded-xl shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
              <ShieldCheck className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Security & Privacy
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                How we protect your payment data
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/10 flex-shrink-0 mt-0.5">
                <Check className="h-3 w-3 text-sky-600 dark:text-sky-400" />
              </div>
              <span className="text-muted-foreground">
                Payment methods are securely stored with Stripe, not on our servers
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/10 flex-shrink-0 mt-0.5">
                <Check className="h-3 w-3 text-sky-600 dark:text-sky-400" />
              </div>
              <span className="text-muted-foreground">
                You can view and delete saved payment methods at any time from your wallet
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/10 flex-shrink-0 mt-0.5">
                <Check className="h-3 w-3 text-sky-600 dark:text-sky-400" />
              </div>
              <span className="text-muted-foreground">
                Disabling automatic saving won't delete existing saved payment methods
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/10 flex-shrink-0 mt-0.5">
                <Check className="h-3 w-3 text-sky-600 dark:text-sky-400" />
              </div>
              <span className="text-muted-foreground">
                All payment data is encrypted and PCI DSS compliant
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          size="lg"
          className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
