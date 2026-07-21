'use client';

/**
 * Password Form
 * Changes the signed-in member's own password.
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  function reset() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setFieldError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFieldError(null);

    if (newPassword !== confirmPassword) {
      setFieldError('The new passwords do not match');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/business/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          setFieldError(result.error || 'Could not change your password');
        } else {
          toast.error(result.error || 'Could not change your password');
        }
        return;
      }

      toast.success(result.data?.message || 'Password updated');
      reset();
    } catch {
      toast.error('Could not change your password');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="bg-card border border-border rounded-xl shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <KeyRound className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Password
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Changing this signs you out on your other devices
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current_password">Current password</Label>
            <Input
              id="current_password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new_password">New password</Label>
            <Input
              id="new_password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              maxLength={72}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm new password</Label>
            <Input
              id="confirm_password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              maxLength={72}
              disabled={isSaving}
            />
            {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}
          </div>

          <Button
            type="submit"
            disabled={isSaving || !currentPassword || newPassword.length < 8 || !confirmPassword}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating…
              </>
            ) : (
              'Change password'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
