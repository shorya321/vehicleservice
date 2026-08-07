'use client';

import { AlertTriangle, CheckCircle2, CircleDashed, Clock, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LuxuryAlert } from '@/components/business/ui';
import { connectionState, type EmailSettings } from './types';

interface ConnectionStatusProps {
  settings: EmailSettings | null;
  platformFallbackFrom: string;
}

function relative(iso: string | null): string {
  if (!iso) return '';

  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h ago`;

  return `${Math.round(minutes / (60 * 24))}d ago`;
}

export function ConnectionStatus({ settings, platformFallbackFrom }: ConnectionStatusProps) {
  const state = connectionState(settings);

  const pill = {
    platform: {
      icon: CircleDashed,
      label: 'Using platform email',
      className: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20',
    },
    untested: {
      icon: Clock,
      label: 'Saved, not tested yet',
      className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    verified_off: {
      icon: Server,
      label: 'Verified, but switched off',
      className: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    },
    connected: {
      icon: CheckCircle2,
      label: `Connected${settings?.last_success_at ? ` · last sent ${relative(settings.last_success_at)}` : ''}`,
      className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    failing: {
      icon: AlertTriangle,
      label: 'Your mail server is failing',
      className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    },
  }[state];

  const Icon = pill.icon;

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium',
          pill.className
        )}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        <span>{pill.label}</span>
      </div>

      {state === 'platform' && (
        <LuxuryAlert variant="info" title="Emails currently send from our address">
          Every email your customers receive is sent from {platformFallbackFrom}. Add your own
          SMTP details below to send from your own domain instead.
        </LuxuryAlert>
      )}

      {state === 'verified_off' && (
        <LuxuryAlert variant="info" title="Ready, but not in use">
          Your server is verified. Turn on &ldquo;Send my emails through this server&rdquo; to
          start using it.
        </LuxuryAlert>
      )}

      {state === 'failing' && settings && (
        <LuxuryAlert variant="error" title="Emails are not going out through your server">
          {settings.consecutive_failures >= 3
            ? `${settings.consecutive_failures} emails in a row failed, so we have stopped trying your server and are sending on ours for now. `
            : ''}
          {settings.last_test_error ?? 'Check the username and password, then send a test email.'}
        </LuxuryAlert>
      )}
    </div>
  );
}
