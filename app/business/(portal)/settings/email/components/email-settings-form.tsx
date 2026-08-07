'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Trash2 } from 'lucide-react';
import {
  LuxuryButton,
  LuxuryCard,
  LuxuryCardContent,
  LuxuryCardDescription,
  LuxuryCardHeader,
  LuxuryCardTitle,
  LuxuryInput,
  LuxurySelect,
  LuxurySelectContent,
  LuxurySelectItem,
  LuxurySelectTrigger,
  LuxurySelectValue,
  LuxurySwitch,
} from '@/components/business/ui';
import {
  PROVIDER_PRESETS,
  SES_REGIONS,
  secureForPort,
  sesHostForRegion,
  type EmailProviderPreset,
} from '@/lib/business/email/provider-presets';
import { SenderChecklist } from './sender-checklist';
import type { EmailSettings } from './types';

interface EmailSettingsFormProps {
  settings: EmailSettings | null;
  onSaved: () => void;
}

interface FormState {
  provider_preset: EmailProviderPreset;
  ses_region: string;
  smtp_host: string;
  smtp_port: string;
  smtp_secure: boolean;
  smtp_username: string;
  smtp_password: string;
  from_name: string;
  from_email: string;
  reply_to: string;
  enabled: boolean;
  allow_platform_fallback: boolean;
}

function initialState(settings: EmailSettings | null): FormState {
  return {
    provider_preset: settings?.provider_preset ?? 'custom',
    ses_region: 'us-east-1',
    smtp_host: settings?.smtp_host ?? '',
    smtp_port: String(settings?.smtp_port ?? 587),
    smtp_secure: settings?.smtp_secure ?? false,
    smtp_username: settings?.smtp_username ?? '',
    // Never prefilled. There is no endpoint that could supply it.
    smtp_password: '',
    from_name: settings?.from_name ?? '',
    from_email: settings?.from_email ?? '',
    reply_to: settings?.reply_to ?? '',
    enabled: settings?.enabled ?? false,
    allow_platform_fallback: settings?.allow_platform_fallback ?? true,
  };
}

export function EmailSettingsForm({ settings, onSaved }: EmailSettingsFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => initialState(settings));
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const preset = PROVIDER_PRESETS[form.provider_preset];
  const verified = settings?.last_test_status === 'success';

  function set<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((current) => ({ ...current, [key]: value }));
  }

  /** Applying a preset rewrites the connection fields but leaves sender identity alone. */
  function applyPreset(id: EmailProviderPreset): void {
    const next = PROVIDER_PRESETS[id];

    setForm((current) => ({
      ...current,
      provider_preset: id,
      smtp_host: id === 'ses' ? sesHostForRegion(current.ses_region) : next.host || current.smtp_host,
      smtp_port: String(next.port),
      smtp_secure: next.secure,
      smtp_username: next.fixedUsername ?? (next.fixedUsername === undefined ? current.smtp_username : ''),
    }));
  }

  /**
   * Port and TLS mode are not independent: 465 is TLS from the first byte, everything
   * else negotiates with STARTTLS. Getting this pair wrong is the most common SMTP
   * misconfiguration, so the form derives it rather than asking twice.
   */
  function applyPort(value: string): void {
    const port = Number(value);
    setForm((current) => ({
      ...current,
      smtp_port: value,
      smtp_secure: Number.isInteger(port) ? secureForPort(port) : current.smtp_secure,
    }));
  }

  async function save(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/business/settings/email', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_preset: form.provider_preset,
          smtp_host: form.smtp_host,
          smtp_port: Number(form.smtp_port),
          smtp_secure: form.smtp_secure,
          smtp_username: form.smtp_username,
          // Omitted when blank, which the API reads as "keep the stored password".
          ...(form.smtp_password ? { smtp_password: form.smtp_password } : {}),
          from_name: form.from_name,
          from_email: form.from_email,
          reply_to: form.reply_to,
          enabled: form.enabled,
          allow_platform_fallback: form.allow_platform_fallback,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload?.error ?? 'Could not save your email settings');
        return;
      }

      // Clear the password from component state the moment it is no longer needed.
      setForm((current) => ({ ...current, smtp_password: '' }));
      toast.success('Email settings saved');
      onSaved();
      router.refresh();
    } catch {
      toast.error('Could not save your email settings');
    } finally {
      setSaving(false);
    }
  }

  async function remove(): Promise<void> {
    setRemoving(true);

    try {
      const response = await fetch('/api/business/settings/email', { method: 'DELETE' });
      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload?.error ?? 'Could not remove your email settings');
        return;
      }

      toast.success(payload?.data?.message ?? 'Reverted to platform email');
      setForm(initialState(null));
      onSaved();
      router.refresh();
    } catch {
      toast.error('Could not remove your email settings');
    } finally {
      setRemoving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <LuxuryCard>
        <LuxuryCardHeader>
          <LuxuryCardTitle>Provider</LuxuryCardTitle>
          <LuxuryCardDescription>
            Choosing a provider fills in its server details. Whatever you pick, we connect over
            standard SMTP.
          </LuxuryCardDescription>
        </LuxuryCardHeader>
        <LuxuryCardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="provider" className="text-sm font-medium">
              Email provider
            </label>
            <LuxurySelect value={form.provider_preset} onValueChange={(v) => applyPreset(v as EmailProviderPreset)}>
              <LuxurySelectTrigger id="provider">
                <LuxurySelectValue />
              </LuxurySelectTrigger>
              <LuxurySelectContent>
                {Object.values(PROVIDER_PRESETS).map((entry) => (
                  <LuxurySelectItem key={entry.id} value={entry.id}>
                    {entry.label}
                  </LuxurySelectItem>
                ))}
              </LuxurySelectContent>
            </LuxurySelect>
          </div>

          {form.provider_preset === 'ses' && (
            <div className="space-y-2">
              <label htmlFor="ses-region" className="text-sm font-medium">
                AWS region
              </label>
              <LuxurySelect
                value={form.ses_region}
                onValueChange={(region) =>
                  setForm((current) => ({
                    ...current,
                    ses_region: region,
                    smtp_host: sesHostForRegion(region),
                  }))
                }
              >
                <LuxurySelectTrigger id="ses-region">
                  <LuxurySelectValue />
                </LuxurySelectTrigger>
                <LuxurySelectContent>
                  {SES_REGIONS.map((region) => (
                    <LuxurySelectItem key={region} value={region}>
                      {region}
                    </LuxurySelectItem>
                  ))}
                </LuxurySelectContent>
              </LuxurySelect>
            </div>
          )}
        </LuxuryCardContent>
      </LuxuryCard>

      <LuxuryCard>
        <LuxuryCardHeader>
          <LuxuryCardTitle>Connection</LuxuryCardTitle>
          <LuxuryCardDescription>Where we connect to hand over your messages.</LuxuryCardDescription>
        </LuxuryCardHeader>
        <LuxuryCardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="smtp-host" className="text-sm font-medium">
                SMTP server
              </label>
              <LuxuryInput
                id="smtp-host"
                value={form.smtp_host}
                onChange={(e) => set('smtp_host', e.target.value)}
                placeholder="smtp.yourprovider.com"
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="smtp-port" className="text-sm font-medium">
                Port
              </label>
              <LuxuryInput
                id="smtp-port"
                type="number"
                min={1}
                max={65535}
                value={form.smtp_port}
                onChange={(e) => applyPort(e.target.value)}
                required
              />
            </div>
          </div>

          <LuxurySwitch
            checked={form.smtp_secure}
            onCheckedChange={(checked) => set('smtp_secure', checked)}
            label="Use TLS on connect"
            description="On for port 465. Off for 587 and 25, which start in the clear and upgrade with STARTTLS."
          />

          <div className="space-y-2">
            <label htmlFor="smtp-username" className="text-sm font-medium">
              Username
            </label>
            <LuxuryInput
              id="smtp-username"
              value={form.smtp_username}
              onChange={(e) => set('smtp_username', e.target.value)}
              readOnly={Boolean(preset.fixedUsername)}
              autoComplete="off"
              required
            />
            <p className="text-xs text-muted-foreground">{preset.usernameHint}</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="smtp-password" className="text-sm font-medium">
              Password
            </label>
            <LuxuryInput
              id="smtp-password"
              type="password"
              value={form.smtp_password}
              onChange={(e) => set('smtp_password', e.target.value)}
              placeholder={
                settings?.has_password
                  ? 'Leave blank to keep the saved password'
                  : 'Your SMTP password or API key'
              }
              autoComplete="new-password"
              required={!settings?.has_password}
            />
            <p className="text-xs text-muted-foreground">
              {preset.passwordHint}
              {settings?.smtp_password_updated_at
                ? ` Last changed ${new Date(settings.smtp_password_updated_at).toLocaleDateString()}.`
                : ''}
            </p>
          </div>
        </LuxuryCardContent>
      </LuxuryCard>

      <LuxuryCard>
        <LuxuryCardHeader>
          <LuxuryCardTitle>Sender identity</LuxuryCardTitle>
          <LuxuryCardDescription>What your customers see in their inbox.</LuxuryCardDescription>
        </LuxuryCardHeader>
        <LuxuryCardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="from-name" className="text-sm font-medium">
                Sender name
              </label>
              <LuxuryInput
                id="from-name"
                value={form.from_name}
                onChange={(e) => set('from_name', e.target.value)}
                placeholder="Acme Transfers"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="from-email" className="text-sm font-medium">
                Sender address
              </label>
              <LuxuryInput
                id="from-email"
                type="email"
                value={form.from_email}
                onChange={(e) => set('from_email', e.target.value)}
                placeholder="bookings@acmehotel.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="reply-to" className="text-sm font-medium">
              Reply-to address <span className="text-muted-foreground">(optional)</span>
            </label>
            <LuxuryInput
              id="reply-to"
              type="email"
              value={form.reply_to}
              onChange={(e) => set('reply_to', e.target.value)}
              placeholder="support@acmehotel.com"
            />
          </div>
        </LuxuryCardContent>
      </LuxuryCard>

      <SenderChecklist preset={preset} fromEmail={form.from_email} />

      <LuxuryCard>
        <LuxuryCardHeader>
          <LuxuryCardTitle>Sending</LuxuryCardTitle>
        </LuxuryCardHeader>
        <LuxuryCardContent className="space-y-4">
          <LuxurySwitch
            checked={form.enabled}
            onCheckedChange={(checked) => set('enabled', checked)}
            disabled={!verified}
            label="Send my emails through this server"
            description={
              verified
                ? 'All booking emails to you and your customers will go out from your own address.'
                : 'Save your details and send a successful test email first. This prevents a wrong password quietly stopping your booking confirmations.'
            }
          />

          <LuxurySwitch
            checked={form.allow_platform_fallback}
            onCheckedChange={(checked) => set('allow_platform_fallback', checked)}
            label="Deliver through us if my server fails"
            description="Keeps booking confirmations arriving during an outage, but those messages show our address as the sender. Turn this off if nothing may ever leave under our name."
          />
        </LuxuryCardContent>
      </LuxuryCard>

      <div className="flex flex-wrap items-center gap-3">
        <LuxuryButton type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
          Save settings
        </LuxuryButton>

        {settings && (
          <LuxuryButton
            type="button"
            variant="ghost"
            onClick={remove}
            disabled={removing}
            className="text-red-600 hover:text-red-700 dark:text-red-400"
          >
            {removing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" aria-hidden />
            )}
            Revert to platform email
          </LuxuryButton>
        )}
      </div>
    </form>
  );
}
