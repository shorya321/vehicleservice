'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, Send, XCircle } from 'lucide-react';
import {
  LuxuryButton,
  LuxuryDialog,
  LuxuryDialogContent,
  LuxuryDialogDescription,
  LuxuryDialogFooter,
  LuxuryDialogHeader,
  LuxuryDialogTitle,
  LuxuryDialogTrigger,
  LuxuryInput,
} from '@/components/business/ui';

interface TestEmailDialogProps {
  defaultRecipient: string;
  disabled: boolean;
  onTested: () => void;
}

type Result = { ok: true } | { ok: false; error: string } | null;

export function TestEmailDialog({ defaultRecipient, disabled, onTested }: TestEmailDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Result>(null);

  async function send(): Promise<void> {
    setSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/business/settings/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_email: recipient }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setResult({ ok: false, error: payload?.error ?? 'Could not send the test email' });
        return;
      }

      if (payload?.data?.sent) {
        setResult({ ok: true });
        toast.success(`Test email sent to ${recipient}`);
      } else {
        setResult({ ok: false, error: payload?.data?.error ?? 'The mail server rejected the message' });
      }

      onTested();
      router.refresh();
    } catch {
      setResult({ ok: false, error: 'Could not reach the server' });
    } finally {
      setSending(false);
    }
  }

  return (
    <LuxuryDialog open={open} onOpenChange={setOpen}>
      <LuxuryDialogTrigger asChild>
        <LuxuryButton type="button" variant="outline" disabled={disabled}>
          <Send className="mr-2 h-4 w-4" aria-hidden />
          Send test email
        </LuxuryButton>
      </LuxuryDialogTrigger>

      <LuxuryDialogContent>
        <LuxuryDialogHeader>
          <LuxuryDialogTitle>Send a test email</LuxuryDialogTitle>
          <LuxuryDialogDescription>
            We will connect to your mail server, authenticate, and send one message. This proves
            the credentials work before any real booking depends on them.
          </LuxuryDialogDescription>
        </LuxuryDialogHeader>

        <div className="space-y-2">
          <label htmlFor="test-recipient" className="text-sm font-medium">
            Send to
          </label>
          <LuxuryInput
            id="test-recipient"
            type="email"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Must be your own address or a team member&rsquo;s.
          </p>
        </div>

        {result?.ok === true && (
          <div className="flex items-start gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div>
              <p className="font-medium">Delivered</p>
              <p>
                Check the inbox, and check spam too. Landing in spam usually means the sending
                domain still needs its SPF and DKIM records.
              </p>
            </div>
          </div>
        )}

        {result?.ok === false && (
          <div className="flex items-start gap-2 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div>
              <p className="font-medium">Not delivered</p>
              <p>{result.error}</p>
            </div>
          </div>
        )}

        <LuxuryDialogFooter>
          <LuxuryButton type="button" variant="ghost" onClick={() => setOpen(false)}>
            Close
          </LuxuryButton>
          <LuxuryButton type="button" onClick={send} disabled={sending || !recipient}>
            {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
            {result ? 'Send again' : 'Send test'}
          </LuxuryButton>
        </LuxuryDialogFooter>
      </LuxuryDialogContent>
    </LuxuryDialog>
  );
}
