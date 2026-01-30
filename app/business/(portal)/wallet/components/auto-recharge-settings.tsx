'use client';

/**
 * Auto-Recharge Settings Component
 * Configure automatic wallet recharge when balance falls below threshold
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/business/(portal)/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
import { Loader2, Save, Zap, AlertTriangle, Info, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatCurrency, type CurrencyCode, getCurrencyOptions } from '@/lib/utils/currency-converter';
import { fadeInUp } from '@/lib/business/animation/variants';

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
    currency: 'AED',
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
        currency: 'AED',
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
      <Card className="bg-card border border-border rounded-xl shadow-sm h-full">
        <CardContent className="p-5 flex items-center justify-center py-12">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border border-border rounded-xl shadow-sm h-full">
      <CardHeader className="p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className={cn('h-5 w-5 transition-colors duration-300', settings.enabled ? 'text-emerald-500' : 'text-muted-foreground')} />
            <CardTitle className="text-lg font-semibold text-foreground">
              Auto-Recharge
            </CardTitle>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
            className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-muted"
          />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Automatically recharge when balance falls below threshold
        </p>
      </CardHeader>
      <CardContent className="p-5 space-y-5">
        {/* Warning when enabled */}
        <AnimatePresence>
          {settings.enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-start gap-3"
            >
              <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-sm text-foreground">
                  Auto-Recharge Active
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Recharges when balance falls below{' '}
                  {formatCurrency(settings.trigger_threshold, settings.currency)}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info about payment methods */}
        {paymentMethods.length === 0 && (
          <div className="rounded-xl bg-sky-500/10 border border-sky-500/20 p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-sky-600 dark:text-sky-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-sm text-foreground">
                No Payment Methods
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Add a payment method first to enable auto-recharge.
              </p>
            </div>
          </div>
        )}

        {/* Trigger Threshold */}
        <div className="space-y-2">
          <Label htmlFor="trigger" className="text-foreground">Trigger Threshold</Label>
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
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 disabled:opacity-50"
          />
          <p className="text-xs text-muted-foreground">
            Recharge when balance falls below this amount
          </p>
        </div>

        {/* Recharge Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-foreground">Recharge Amount</Label>
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
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 disabled:opacity-50"
          />
          <p className="text-xs text-muted-foreground">Amount to add when triggered</p>
        </div>

        {/* Monthly Limit */}
        <div className="space-y-2">
          <Label htmlFor="monthlyLimit" className="text-foreground">Monthly Limit (Optional)</Label>
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
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 disabled:opacity-50"
          />
          <p className="text-xs text-muted-foreground">
            Maximum auto-recharge amount per month
          </p>
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <Label htmlFor="currency" className="text-foreground">Currency</Label>
          <Select
            value={settings.currency}
            onValueChange={(value) => setSettings({ ...settings, currency: value as CurrencyCode })}
            disabled={!settings.enabled}
          >
            <SelectTrigger
              id="currency"
              className="bg-muted border-border text-foreground focus:border-primary focus:ring-primary/20 disabled:opacity-50"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {getCurrencyOptions().map((option) => (
                <SelectItem
                  key={option.code}
                  value={option.code}
                  className="text-foreground focus:bg-primary/10 focus:text-foreground"
                >
                  {option.code} - {option.name} ({option.symbol})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Payment Method Selection */}
        {paymentMethods.length > 0 && (
          <div className="space-y-3">
            <Label className="text-foreground">Payment Method</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="useDefault"
                  checked={settings.use_default_payment_method}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, use_default_payment_method: checked })
                  }
                  disabled={!settings.enabled}
                  className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
                />
                <Label
                  htmlFor="useDefault"
                  className="font-normal cursor-pointer mb-0 text-foreground/80"
                >
                  Use default payment method
                </Label>
              </div>

              <AnimatePresence>
                {!settings.use_default_payment_method && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Select
                      value={settings.payment_method_id || ''}
                      onValueChange={(value) => setSettings({ ...settings, payment_method_id: value })}
                      disabled={!settings.enabled}
                    >
                      <SelectTrigger className="bg-muted border-border text-foreground focus:border-primary focus:ring-primary/20 disabled:opacity-50">
                        <SelectValue placeholder="Select a payment method" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {paymentMethods.map((pm) => (
                          <SelectItem
                            key={pm.id}
                            value={pm.id}
                            className="text-foreground focus:bg-primary/10 focus:text-foreground"
                          >
                            {pm.card_brand} •••• {pm.card_last4}
                            {pm.is_default && ' (Default)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                SAVE SETTINGS
              </>
            )}
          </Button>

          {exists && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  disabled={isSaving}
                  className="text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-foreground">
                    Delete Auto-Recharge Settings?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    This will permanently delete your auto-recharge configuration.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-transparent border-border text-muted-foreground hover:bg-muted hover:text-foreground">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 text-white hover:bg-red-600/90"
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
