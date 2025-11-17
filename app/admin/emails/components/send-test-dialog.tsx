'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { sendTestEmail } from '../actions';
import { type EmailTemplateType } from '@/lib/email/utils/preview-data';

interface SendTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: EmailTemplateType | null;
  templateName: string;
}

export function SendTestDialog({
  open,
  onOpenChange,
  templateId,
  templateName,
}: SendTestDialogProps) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!templateId) {
      toast.error('No template selected');
      return;
    }

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSending(true);

    try {
      const result = await sendTestEmail({
        templateId,
        recipientEmail: email,
      });

      if (result.success) {
        toast.success('Test email sent successfully!', {
          description: `Sent to ${email}`,
        });
        setEmail('');
        onOpenChange(false);
      } else {
        toast.error('Failed to send test email', {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error('Failed to send test email', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Test Email</DialogTitle>
          <DialogDescription>
            Send a test email for <strong>{templateName}</strong> with sample data.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Recipient Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={sending}
            />
            <p className="text-sm text-muted-foreground">
              The email will be sent with sample data for preview purposes.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? 'Sending...' : 'Send Test Email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
