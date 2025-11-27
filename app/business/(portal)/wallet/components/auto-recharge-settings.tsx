'use client';

/**
 * Auto-Recharge Settings Component
 * Configure automatic wallet recharge when balance falls below threshold
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Save, Zap, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, type CurrencyCode, getCurrencyOptions } from '@/lib/utils/currency-converter';

interface AutoRechargeSettings {
  enabled: boolean;
  trigger_threshold: number;
  recharge_amount: number;
  max_recharge_per_month: number | null;
  currency: CurrencyCode;
  use_default_payment_method: boolean;
  payment_method_id: string | null;
}

interface PaymentMethod {
  id: string;
  card_brand?: string;
  card_last4?: string;
  is_default: boolean;
}

export function AutoRechargeSettings() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [exists, setExists] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const [settings, setSettings] = useState<AutoRechargeSettings>({
    enabled: false,
    trigger_threshold: 100.0,
    recharge_amount: 500.0,
    max_recharge_per_month: 5000.0,
    currency: 'USD',
    use_default_payment_method: true,
    payment_method_id: null,
  });

  useEffect(() => {
    loadSettings();
    loadPaymentMethods();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/business/wallet/auto-recharge/settings');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load settings');
      }

      // API wraps response in { data: { exists, settings } }
      const { exists, settings } = result.data;
      setExists(exists);
      setSettings(settings);
    } catch (error) {
      console.error('Error loading auto-recharge settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const response = await fetch('/api/business/wallet/payment-element/payment-methods');
      const result = await response.json();

      if (response.ok && result.data) {
        setPaymentMethods(result.data.payment_methods || []);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const handleSave = async () => {
    try {
      // Validation
      if (settings.enabled && settings.trigger_threshold < 0) {
        toast.error('Trigger threshold must be positive');
        return;
      }

      if (settings.enabled && settings.recharge_amount < 10) {
        toast.error('Recharge amount must be at least $10');
        return;
      }

      if (
        settings.enabled &&
        settings.max_recharge_per_month !== null &&
        settings.recharge_amount > settings.max_recharge_per_month
      ) {
        toast.error('Recharge amount cannot exceed monthly limit');
        return;
      }

      // Check if payment method exists
      if (settings.enabled && paymentMethods.length === 0) {
        toast.error('Please add a payment method before enabling auto-recharge');
        return;
      }

      setIsSaving(true);

      const response = await fetch('/api/business/wallet/auto-recharge/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      toast.success('Auto-recharge settings saved successfully');
      setExists(true);
      router.refresh();
    } catch (error) {
      console.error('Error saving auto-recharge settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSaving(true);

      const response = await fetch('/api/business/wallet/auto-recharge/settings', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete settings');
      }

      toast.success('Auto-recharge disabled and settings deleted');
      setExists(false);
      setSettings({
        enabled: false,
        trigger_threshold: 100.0,
        recharge_amount: 500.0,
        max_recharge_per_month: 5000.0,
        currency: 'USD',
        use_default_payment_method: true,
        payment_method_id: null,
      });
      router.refresh();
    } catch (error) {
      console.error('Error deleting auto-recharge settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle>Auto-Recharge Settings</CardTitle>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
          />
        </div>
        <CardDescription>
          Automatically recharge your wallet when the balance falls below the threshold
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Warning when enabled */}
        {settings.enabled && (
          <div className="rounded-lg bg-[var(--business-warning)]/10 border border-[var(--business-warning)]/20 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-[var(--business-warning)] mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-sm">Auto-Recharge Active</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Your wallet will be automatically recharged when the balance falls below{' '}
                {formatCurrency(settings.trigger_threshold, settings.currency)}.
              </p>
            </div>
          </div>
        )}

        {/* Info about payment methods */}
        {paymentMethods.length === 0 && (
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-sm">No Payment Methods</h4>
              <p className="text-sm text-muted-foreground mt-1">
                You need to add at least one payment method before you can enable auto-recharge.
              </p>
            </div>
          </div>
        )}

        {/* Trigger Threshold */}
        <div className="space-y-2">
          <Label htmlFor="trigger">Trigger Threshold</Label>
          <Input
            id="trigger"
            type="number"
            min="0"
            step="10"
            value={settings.trigger_threshold}
            onChange={(e) =>
              setSettings({ ...settings, trigger_threshold: parseFloat(e.target.value) || 0 })
            }
            disabled={!settings.enabled}
          />
          <p className="text-sm text-muted-foreground">
            Recharge when balance falls below this amount
          </p>
        </div>

        {/* Recharge Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">Recharge Amount</Label>
          <Input
            id="amount"
            type="number"
            min="10"
            step="10"
            value={settings.recharge_amount}
            onChange={(e) =>
              setSettings({ ...settings, recharge_amount: parseFloat(e.target.value) || 0 })
            }
            disabled={!settings.enabled}
          />
          <p className="text-sm text-muted-foreground">Amount to add when triggered</p>
        </div>

        {/* Monthly Limit */}
        <div className="space-y-2">
          <Label htmlFor="monthlyLimit">Monthly Recharge Limit (Optional)</Label>
          <Input
            id="monthlyLimit"
            type="number"
            min="0"
            step="100"
            value={settings.max_recharge_per_month || ''}
            onChange={(e) =>
              setSettings({
                ...settings,
                max_recharge_per_month: e.target.value ? parseFloat(e.target.value) : null,
              })
            }
            placeholder="No limit"
            disabled={!settings.enabled}
          />
          <p className="text-sm text-muted-foreground">
            Maximum total auto-recharge amount per month (safety limit)
          </p>
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={settings.currency}
            onValueChange={(value) => setSettings({ ...settings, currency: value as CurrencyCode })}
            disabled={!settings.enabled}
          >
            <SelectTrigger id="currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getCurrencyOptions().map((option) => (
                <SelectItem key={option.code} value={option.code}>
                  {option.code} - {option.name} ({option.symbol})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Payment Method Selection */}
        {paymentMethods.length > 0 && (
          <div className="space-y-3">
            <Label>Payment Method</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="useDefault"
                  checked={settings.use_default_payment_method}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, use_default_payment_method: checked })
                  }
                  disabled={!settings.enabled}
                />
                <Label htmlFor="useDefault" className="font-normal cursor-pointer">
                  Use default payment method
                </Label>
              </div>

              {!settings.use_default_payment_method && (
                <Select
                  value={settings.payment_method_id || ''}
                  onValueChange={(value) => setSettings({ ...settings, payment_method_id: value })}
                  disabled={!settings.enabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((pm) => (
                      <SelectItem key={pm.id} value={pm.id}>
                        {pm.card_brand} •••• {pm.card_last4}
                        {pm.is_default && ' (Default)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button onClick={handleSave} disabled={isSaving} className="flex-1">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>

          {exists && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={isSaving}>
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Auto-Recharge Settings?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your auto-recharge configuration. Auto-recharge will be
                    disabled and all settings will be removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Settings
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
