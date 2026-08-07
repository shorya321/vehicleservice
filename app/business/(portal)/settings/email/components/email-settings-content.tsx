'use client';

import { useRouter } from 'next/navigation';
import {
  LuxuryTabs,
  LuxuryTabsContent,
  LuxuryTabsList,
  LuxuryTabsTrigger,
} from '@/components/business/ui';
import { ConnectionStatus } from './connection-status';
import { EmailSettingsForm } from './email-settings-form';
import { EmailLogTable } from './email-log-table';
import { TestEmailDialog } from './test-email-dialog';
import type { EmailLogEntry, EmailSettings } from './types';

interface EmailSettingsContentProps {
  initialSettings: EmailSettings | null;
  initialLogs: EmailLogEntry[];
  platformFallbackFrom: string;
  memberEmail: string;
}

export function EmailSettingsContent({
  initialSettings,
  initialLogs,
  platformFallbackFrom,
  memberEmail,
}: EmailSettingsContentProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <ConnectionStatus settings={initialSettings} platformFallbackFrom={platformFallbackFrom} />

      <LuxuryTabs defaultValue="configuration">
        <LuxuryTabsList>
          <LuxuryTabsTrigger value="configuration">Configuration</LuxuryTabsTrigger>
          <LuxuryTabsTrigger value="log">Delivery log</LuxuryTabsTrigger>
        </LuxuryTabsList>

        <LuxuryTabsContent value="configuration" className="space-y-6">
          <EmailSettingsForm settings={initialSettings} onSaved={() => router.refresh()} />

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
            <TestEmailDialog
              defaultRecipient={memberEmail}
              // Nothing to test until a server and a password are stored.
              disabled={!initialSettings?.has_password}
              onTested={() => router.refresh()}
            />
            <p className="text-sm text-muted-foreground">
              {initialSettings?.has_password
                ? 'Verifies the connection and sends one message.'
                : 'Save your server details first.'}
            </p>
          </div>
        </LuxuryTabsContent>

        <LuxuryTabsContent value="log">
          <EmailLogTable initialLogs={initialLogs} />
        </LuxuryTabsContent>
      </LuxuryTabs>
    </div>
  );
}
