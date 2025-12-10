'use client';

/**
 * Business Notification Preferences Settings Page
 * Allows businesses to configure wallet notification preferences
 *
 * Design System: Premium Indigo - Stripe/Linear inspired
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PageHeader, PageContainer } from '@/components/business/layout';
import { toast } from 'sonner';
import { Loader2, Bell, Mail, CheckCircle2 } from 'lucide-react';

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

export default function NotificationPreferencesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({});
  const [hasChanges, setHasChanges] = useState(false);

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

      {/* Low Balance Alert */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Low Balance Alert
              </CardTitle>
              <CardDescription>
                Get notified when your wallet balance falls below a threshold
              </CardDescription>
            </div>
            <Switch
              checked={preferences.low_balance_alert?.enabled || false}
              onCheckedChange={(checked) =>
                updatePreference('low_balance_alert', { enabled: checked })
              }
            />
          </div>
        </CardHeader>
        {preferences.low_balance_alert?.enabled && (
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="low-balance-threshold">Alert Threshold (AED)</Label>
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
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                You'll receive an alert when your balance drops below this amount
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>Notifications sent via email</span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Transaction Completed */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Transaction Completed
              </CardTitle>
              <CardDescription>
                Receive confirmation for every wallet transaction
              </CardDescription>
            </div>
            <Switch
              checked={preferences.transaction_completed?.enabled || false}
              onCheckedChange={(checked) =>
                updatePreference('transaction_completed', { enabled: checked })
              }
            />
          </div>
        </CardHeader>
        {preferences.transaction_completed?.enabled && (
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>Notifications sent via email</span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Auto-Recharge Success */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Auto-Recharge Success</CardTitle>
              <CardDescription>
                Get notified when automatic recharge completes successfully
              </CardDescription>
            </div>
            <Switch
              checked={preferences.auto_recharge_success?.enabled || false}
              onCheckedChange={(checked) =>
                updatePreference('auto_recharge_success', { enabled: checked })
              }
            />
          </div>
        </CardHeader>
        {preferences.auto_recharge_success?.enabled && (
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>Notifications sent via email</span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Auto-Recharge Failed */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Auto-Recharge Failed</CardTitle>
              <CardDescription>
                Get notified when automatic recharge fails (always on)
              </CardDescription>
            </div>
            <Switch
              checked={preferences.auto_recharge_failed?.enabled !== false}
              onCheckedChange={(checked) =>
                updatePreference('auto_recharge_failed', { enabled: checked })
              }
            />
          </div>
        </CardHeader>
        {preferences.auto_recharge_failed?.enabled !== false && (
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>Notifications sent via email</span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Wallet Frozen */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Wallet Frozen</CardTitle>
              <CardDescription>
                Get notified when your wallet is frozen (always on)
              </CardDescription>
            </div>
            <Switch checked={true} disabled />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>Critical notifications cannot be disabled</span>
          </div>
        </CardContent>
      </Card>

      {/* Spending Limit Reached */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Spending Limit Reached</CardTitle>
              <CardDescription>
                Get notified when you reach your spending limits
              </CardDescription>
            </div>
            <Switch
              checked={preferences.spending_limit_reached?.enabled !== false}
              onCheckedChange={(checked) =>
                updatePreference('spending_limit_reached', { enabled: checked })
              }
            />
          </div>
        </CardHeader>
        {preferences.spending_limit_reached?.enabled !== false && (
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>Notifications sent via email</span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Monthly Statement */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Monthly Statement</CardTitle>
              <CardDescription>
                Receive a comprehensive monthly wallet statement
              </CardDescription>
            </div>
            <Switch
              checked={preferences.monthly_statement?.enabled || false}
              onCheckedChange={(checked) =>
                updatePreference('monthly_statement', { enabled: checked })
              }
            />
          </div>
        </CardHeader>
        {preferences.monthly_statement?.enabled && (
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>Sent on the 1st of each month via email</span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!hasChanges || saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Preferences'
          )}
        </Button>
      </div>
    </PageContainer>
  );
}
