'use client';

/**
 * Add Staff Dialog
 * Creates a staff member under the owner's business account.
 *
 * The owner either lets the system generate a password or sets one themselves,
 * mirroring the admin panel's password_option flow. A generated password is
 * shown exactly once - it is never stored in readable form.
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type PasswordOption = 'generate' | 'custom';

interface AddStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function AddStaffDialog({ open, onOpenChange, onCreated }: AddStaffDialogProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [passwordOption, setPasswordOption] = useState<PasswordOption>('generate');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function resetForm() {
    setFullName('');
    setEmail('');
    setPasswordOption('generate');
    setPassword('');
    setGeneratedPassword(null);
    setCopied(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      resetForm();
    }
    onOpenChange(next);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/business/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password_option: passwordOption,
          ...(passwordOption === 'custom' ? { password } : {}),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Failed to add the staff member');
        return;
      }

      onCreated();

      if (result.data?.temporaryPassword) {
        // Keep the dialog open so the owner can copy the password before it is gone.
        setGeneratedPassword(result.data.temporaryPassword);
        toast.success('Staff member added');
        return;
      }

      toast.success('Staff member added');
      handleOpenChange(false);
    } catch {
      toast.error('Failed to add the staff member');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!generatedPassword) return;

    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {generatedPassword ? (
          <>
            <DialogHeader>
              <DialogTitle>Staff member added</DialogTitle>
              <DialogDescription>
                Share this password with {fullName || email}. It will not be shown again.
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
              <code className="flex-1 break-all font-mono text-sm">{generatedPassword}</code>
              <Button type="button" variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="sr-only">Copy password</span>
              </Button>
            </div>

            <DialogFooter>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Add staff member</DialogTitle>
              <DialogDescription>
                They can create bookings for customers and will see only the bookings they
                create.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="staff-name">Full name</Label>
                <Input
                  id="staff-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Cooper"
                  required
                  minLength={2}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-email">Email</Label>
                <Input
                  id="staff-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Must be an email that isn&apos;t already registered on the platform.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <RadioGroup
                  value={passwordOption}
                  onValueChange={(value) => setPasswordOption(value as PasswordOption)}
                  className="gap-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="generate" id="pw-generate" />
                    <Label htmlFor="pw-generate" className="font-normal">
                      Generate one for me
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="custom" id="pw-custom" />
                    <Label htmlFor="pw-custom" className="font-normal">
                      Set a password
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {passwordOption === 'custom' && (
                <div className="space-y-2">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Adding…' : 'Add staff member'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
