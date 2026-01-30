'use client';

/**
 * Business Notification Preferences Settings Page
 * Allows businesses to configure wallet notification preferences
 *
 * Design System: Clean shadcn with Gold Accent - matches dashboard styling
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PageHeader, PageContainer } from '@/components/business/layout';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/lib/business/animation/hooks';
import {
  Loader2,
  Bell,
  Mail,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  TrendingDown,
  FileText,
  RefreshCw,
} from 'lucide-react';

interface NotificationConfig {
  enabled: boolean;
  channels: string[];
  threshold?: number;
  frequency?: string;
}

interface NotificationPreferences {
  low_balance_alert?: NotificationConfig;
  transaction_completed?: NotificationConfig;
  auto_recharge_success?: NotificationConfig;
  auto_recharge_failed?: NotificationConfig;
  wallet_frozen?: NotificationConfig;
  spending_limit_reached?: NotificationConfig;
  monthly_statement?: NotificationConfig;
}

// Notification type configurations with semantic colors
const notificationTypes = {
  low_balance_alert: {
    icon: AlertTriangle,
    title: 'Low Balance Alert',
    description: 'Get notified when your wallet balance falls below a threshold',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  transaction_completed: {
    icon: CheckCircle2,
    title: 'Transaction Completed',
    description: 'Receive confirmation for every wallet transaction',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  auto_recharge_success: {
    icon: RefreshCw,
    title: 'Auto-Recharge Success',
    description: 'Get notified when automatic recharge completes successfully',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  auto_recharge_failed: {
    icon: XCircle,
    title: 'Auto-Recharge Failed',
    description: 'Get notified when automatic recharge fails (always on)',
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  wallet_frozen: {
    icon: ShieldAlert,
    title: 'Wallet Frozen',
    description: 'Get notified when your wallet is frozen (always on)',
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-600 dark:text-red-400',
    disabled: true,
  },
  spending_limit_reached: {
    icon: TrendingDown,
    title: 'Spending Limit Reached',
    description: 'Get notified when you reach your spending limits',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  monthly_statement: {
    icon: FileText,
    title: 'Monthly Statement',
    description: 'Receive a comprehensive monthly wallet statement',
    iconBg: 'bg-sky-500/10',
    iconColor: 'text-sky-600 dark:text-sky-400',
    emailNote: 'Sent on the 1st of each month via email',
  },
};

export default function NotificationPreferencesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({});
  const [hasChanges, setHasChanges] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
    },
  };

  // Fetch current preferences
  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/business/wallet/notifications/preferences');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load preferences');
      }

      setPreferences(data.data.notification_preferences || {});
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, updates: Partial<NotificationConfig>) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        ...updates,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/business/wallet/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save preferences');
      }

      toast.success('Notification preferences saved successfully');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  // Helper to check if a notification is enabled
  const isEnabled = (key: keyof NotificationPreferences) => {
    if (key === 'wallet_frozen') return true; // Always on
    if (key === 'auto_recharge_failed' || key === 'spending_limit_reached') {
      return preferences[key]?.enabled !== false;
    }
    return preferences[key]?.enabled || false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Notification Preferences"
        description="Configure how and when you receive wallet notifications"
      />

      <motion.div
        variants={prefersReducedMotion ? undefined : containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {/* Low Balance Alert */}
        <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
          <Card className="bg-card border border-border rounded-xl shadow-sm transition-all duration-300 hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    notificationTypes.low_balance_alert.iconBg
                  )}>
                    <AlertTriangle className={cn('h-5 w-5', notificationTypes.low_balance_alert.iconColor)} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-foreground">
                      {notificationTypes.low_balance_alert.title}
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm text-muted-foreground">
                      {notificationTypes.low_balance_alert.description}
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={isEnabled('low_balance_alert')}
                  onCheckedChange={(checked) =>
                    updatePreference('low_balance_alert', { enabled: checked })
                  }
                />
              </div>
            </CardHeader>
            {isEnabled('low_balance_alert') && (
              <CardContent className="space-y-4 pt-0">
                <div>
                  <Label htmlFor="low-balance-threshold" className="text-sm font-medium text-foreground">
                    Alert Threshold (AED)
                  </Label>
                  <Input
                    id="low-balance-threshold"
                    type="number"
                    min="0"
                    step="0.01"
                    value={preferences.low_balance_alert?.threshold || 0}
                    onChange={(e) =>
                      updatePreference('low_balance_alert', {
                        threshold: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-2 bg-background"
                  />
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    You&apos;ll receive an alert when your balance drops below this amount
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>Notifications sent via email</span>
                </div>
              </CardContent>
            )}
          </Card>
        </motion.div>

        {/* Transaction Completed */}
        <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
          <Card className="bg-card border border-border rounded-xl shadow-sm transition-all duration-300 hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    notificationTypes.transaction_completed.iconBg
                  )}>
                    <CheckCircle2 className={cn('h-5 w-5', notificationTypes.transaction_completed.iconColor)} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-foreground">
                      {notificationTypes.transaction_completed.title}
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm text-muted-foreground">
                      {notificationTypes.transaction_completed.description}
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={isEnabled('transaction_completed')}
                  onCheckedChange={(checked) =>
                    updatePreference('transaction_completed', { enabled: checked })
                  }
                />
              </div>
            </CardHeader>
            {isEnabled('transaction_completed') && (
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>Notifications sent via email</span>
                </div>
              </CardContent>
            )}
          </Card>
        </motion.div>

        {/* Auto-Recharge Success */}
        <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
          <Card className="bg-card border border-border rounded-xl shadow-sm transition-all duration-300 hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    notificationTypes.auto_recharge_success.iconBg
                  )}>
                    <RefreshCw className={cn('h-5 w-5', notificationTypes.auto_recharge_success.iconColor)} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-foreground">
                      {notificationTypes.auto_recharge_success.title}
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm text-muted-foreground">
                      {notificationTypes.auto_recharge_success.description}
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={isEnabled('auto_recharge_success')}
                  onCheckedChange={(checked) =>
                    updatePreference('auto_recharge_success', { enabled: checked })
                  }
                />
              </div>
            </CardHeader>
            {isEnabled('auto_recharge_success') && (
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>Notifications sent via email</span>
                </div>
              </CardContent>
            )}
          </Card>
        </motion.div>

        {/* Auto-Recharge Failed */}
        <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
          <Card className="bg-card border border-border rounded-xl shadow-sm transition-all duration-300 hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    notificationTypes.auto_recharge_failed.iconBg
                  )}>
                    <XCircle className={cn('h-5 w-5', notificationTypes.auto_recharge_failed.iconColor)} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-foreground">
                      {notificationTypes.auto_recharge_failed.title}
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm text-muted-foreground">
                      {notificationTypes.auto_recharge_failed.description}
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={isEnabled('auto_recharge_failed')}
                  onCheckedChange={(checked) =>
                    updatePreference('auto_recharge_failed', { enabled: checked })
                  }
                />
              </div>
            </CardHeader>
            {isEnabled('auto_recharge_failed') && (
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>Notifications sent via email</span>
                </div>
              </CardContent>
            )}
          </Card>
        </motion.div>

        {/* Wallet Frozen */}
        <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
          <Card className="bg-card border border-border rounded-xl shadow-sm transition-all duration-300 hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    notificationTypes.wallet_frozen.iconBg
                  )}>
                    <ShieldAlert className={cn('h-5 w-5', notificationTypes.wallet_frozen.iconColor)} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-foreground">
                      {notificationTypes.wallet_frozen.title}
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm text-muted-foreground">
                      {notificationTypes.wallet_frozen.description}
                    </CardDescription>
                  </div>
                </div>
                <Switch checked={true} disabled />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>Critical notifications cannot be disabled</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Spending Limit Reached */}
        <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
          <Card className="bg-card border border-border rounded-xl shadow-sm transition-all duration-300 hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    notificationTypes.spending_limit_reached.iconBg
                  )}>
                    <TrendingDown className={cn('h-5 w-5', notificationTypes.spending_limit_reached.iconColor)} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-foreground">
                      {notificationTypes.spending_limit_reached.title}
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm text-muted-foreground">
                      {notificationTypes.spending_limit_reached.description}
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={isEnabled('spending_limit_reached')}
                  onCheckedChange={(checked) =>
                    updatePreference('spending_limit_reached', { enabled: checked })
                  }
                />
              </div>
            </CardHeader>
            {isEnabled('spending_limit_reached') && (
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>Notifications sent via email</span>
                </div>
              </CardContent>
            )}
          </Card>
        </motion.div>

        {/* Monthly Statement */}
        <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
          <Card className="bg-card border border-border rounded-xl shadow-sm transition-all duration-300 hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    notificationTypes.monthly_statement.iconBg
                  )}>
                    <FileText className={cn('h-5 w-5', notificationTypes.monthly_statement.iconColor)} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-foreground">
                      {notificationTypes.monthly_statement.title}
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm text-muted-foreground">
                      {notificationTypes.monthly_statement.description}
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={isEnabled('monthly_statement')}
                  onCheckedChange={(checked) =>
                    updatePreference('monthly_statement', { enabled: checked })
                  }
                />
              </div>
            </CardHeader>
            {isEnabled('monthly_statement') && (
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>Sent on the 1st of each month via email</span>
                </div>
              </CardContent>
            )}
          </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div
          variants={prefersReducedMotion ? undefined : itemVariants}
          className="flex justify-end pt-2"
        >
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </Button>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
