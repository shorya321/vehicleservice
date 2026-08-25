'use client';

import { ExternalLink } from 'lucide-react';
import {
  LuxuryAlert,
  LuxuryCard,
  LuxuryCardContent,
  LuxuryCardDescription,
  LuxuryCardHeader,
  LuxuryCardTitle,
} from '@/components/business/ui';
import type { ProviderPreset } from '@/lib/business/email/provider-presets';

interface SenderChecklistProps {
  preset: ProviderPreset;
  fromEmail: string;
  /** The tenant's verified custom domain, used before a sender address is typed. */
  tenantDomain: string | null;
}

function domainOf(email: string): string | null {
  const at = email.lastIndexOf('@');
  return at > 0 ? email.slice(at + 1).toLowerCase() : null;
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-border pl-4">
      <p className="text-sm font-medium">
        {n}. {title}
      </p>
      <div className="mt-1 space-y-2 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

function Record({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-xs">{children}</pre>
  );
}

/**
 * What an owner has to do at their DNS host before mail from their domain is accepted.
 *
 * We cannot do any of it for them, and the most common support case is a business that
 * saved correct SMTP credentials and still had everything land in spam because the
 * domain was never authenticated.
 */
export function SenderChecklist({ preset, fromEmail, tenantDomain }: SenderChecklistProps) {
  // The sender address first, because that is the domain these records must authenticate.
  // The tenant's verified domain is the next best guess while the field is still empty,
  // so the steps name a real domain instead of a placeholder the owner has to translate.
  const domain = domainOf(fromEmail) ?? tenantDomain ?? 'yourdomain.com';

  return (
    <LuxuryCard className="hidden">
      <LuxuryCardHeader>
        <LuxuryCardTitle>Before your first email</LuxuryCardTitle>
        <LuxuryCardDescription>
          Correct credentials get your mail accepted by your provider. These records get it
          accepted by your customers&rsquo; inboxes.
        </LuxuryCardDescription>
      </LuxuryCardHeader>

      <LuxuryCardContent className="space-y-4">
        <Step n={1} title={`Verify ${domain} with your provider`}>
          <p>
            Until {domain} is verified, your provider rejects every message with a 550 error,
            no matter how correct the password is.
          </p>
          {preset.verifyUrl && (
            <a
              href={preset.verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              {preset.verifyLabel ?? 'Open provider settings'}
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          )}
        </Step>

        {preset.managedDomain ? (
          <LuxuryAlert variant="info" title="Google signs your mail for you">
            Send from your own Google address. A sender address on a different domain will be
            rewritten or rejected, so SPF and DKIM records are not something you add here.
          </LuxuryAlert>
        ) : (
          <>
            <Step n={2} title="Add an SPF record">
              {preset.spfInclude ? (
                <>
                  <p>
                    A <code>TXT</code> record on <code>{domain}</code>:
                  </p>
                  <Record>v=spf1 include:{preset.spfInclude} ~all</Record>
                </>
              ) : (
                /*
                  A custom server has no include we can know, and printing a placeholder
                  produces a record that looks copy-pasteable and authorises nothing. Ask
                  for the real value instead of inventing one.
                */
                <p>
                  Your provider publishes the <code>include:</code> value for their sending
                  servers. Add it to a <code>TXT</code> record on <code>{domain}</code> in the
                  form <code>v=spf1 include:their-value ~all</code>.
                </p>
              )}
              <p>
                If {domain} already has an SPF record, merge this <code>include:</code> into it.
                Two separate SPF records is itself a failure.
              </p>
            </Step>

            <Step n={3} title="Add your DKIM records">
              <p>
                Your provider generates these, because the signing keys are theirs. Copy the
                <code> CNAME</code> or <code>TXT</code> records from the verification screen above.
              </p>
            </Step>

            <Step n={4} title="Add a DMARC record">
              <p>
                A <code>TXT</code> record on <code>_dmarc.{domain}</code>:
              </p>
              <Record>v=DMARC1; p=none; rua=mailto:postmaster@{domain}</Record>
              <p>
                Start at <code>p=none</code>, which only reports. Tighten it once you can see
                that everything is passing.
              </p>
            </Step>
          </>
        )}
      </LuxuryCardContent>
    </LuxuryCard>
  );
}
