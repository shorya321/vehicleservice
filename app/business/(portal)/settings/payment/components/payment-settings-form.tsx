'use client';

/**
 * Payment Settings Form Component
 * Allows business owners to configure payment-related settings
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, CreditCard, DollarSign, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
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
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <CardTitle>Payment Methods</CardTitle>
          </div>
          <CardDescription>
            Configure how payment methods are saved and managed for your business
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Save Payment Methods Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1 max-w-2xl">
              <Label htmlFor="save-payment-methods" className="text-base">
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
            />
          </div>

          {/* Payment Element Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1 max-w-2xl">
              <Label htmlFor="payment-element" className="text-base">
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
            />
          </div>
        </CardContent>
      </Card>

      {/* Currency Settings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            <CardTitle>Currency Settings</CardTitle>
          </div>
          <CardDescription>Select your preferred currency for wallet transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="preferred-currency">Preferred Currency</Label>
            <Select
              value={settings.preferred_currency}
              onValueChange={(value: CurrencyCode) =>
                setSettings((prev) => ({ ...prev, preferred_currency: value }))
              }
            >
              <SelectTrigger id="preferred-currency" className="max-w-xs">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
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
      <Card className="border-muted-foreground/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Security & Privacy</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Payment methods are securely stored with Stripe, not on our servers</li>
            <li>• You can view and delete saved payment methods at any time from your wallet</li>
            <li>• Disabling automatic saving won't delete existing saved payment methods</li>
            <li>• All payment data is encrypted and PCI DSS compliant</li>
          </ul>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || !hasChanges} size="lg">
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
