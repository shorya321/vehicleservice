'use client';

/**
 * Display Name Form
 * Edits the signed-in member's own name (business_users.full_name).
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, UserCircle } from 'lucide-react';
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
import { updateMemberDisplayName } from '../actions/profile';

interface DisplayNameFormProps {
  displayName: string;
  email: string;
}

export function DisplayNameForm({ displayName, email }: DisplayNameFormProps) {
  const router = useRouter();
  const [name, setName] = useState(displayName);
  const [isSaving, setIsSaving] = useState(false);

  const isUnchanged = name.trim() === displayName.trim();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append('full_name', name);

      const result = await updateMemberDisplayName(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Name updated');
      router.refresh();
    } catch {
      toast.error('Failed to update your name');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="bg-card border border-border rounded-xl shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <UserCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Your Details
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              The name shown across the portal
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              minLength={2}
              maxLength={100}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile_email">Email</Label>
            <Input id="profile_email" value={email} disabled readOnly />
            <p className="text-xs text-muted-foreground">
              This is your sign-in address. Contact your account owner to change it.
            </p>
          </div>

          <Button type="submit" disabled={isSaving || isUnchanged || name.trim().length < 2}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
