/**
 * DNS Instructions Component
 * Display DNS configuration instructions
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Code, ChevronDown } from 'lucide-react';

interface DNSInstructionsProps {
  customDomain: string;
  verificationToken: string | null;
  cnameTarget?: string; // Optional - auto-fetched from Vercel API
}

export function DNSInstructions({ customDomain, verificationToken, cnameTarget = 'cname.vercel-dns.com' }: DNSInstructionsProps) {
  const txtRecordName = `_verify.${customDomain}`;

  return (
    <Card className="bg-card border border-border rounded-xl shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
            <Code className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              DNS Configuration Instructions
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Add these DNS records to your domain provider (GoDaddy, Cloudflare, etc.)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: CNAME Record */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-bold">1</span>
            Add CNAME Record
          </h3>
          <p className="text-sm text-muted-foreground">
            This points your custom domain to our service.
          </p>
          <div className="bg-muted border border-border p-4 rounded-xl space-y-2 text-sm font-mono">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-muted-foreground text-xs uppercase tracking-wider">Type:</span>
                <p className="font-semibold text-sky-600 dark:text-sky-400">CNAME</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs uppercase tracking-wider">Name:</span>
                <p className="font-semibold text-foreground break-all">{customDomain.split('.')[0]}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs uppercase tracking-wider">Value:</span>
                <p className="font-semibold text-foreground break-all">{cnameTarget}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: TXT Record for Verification */}
        {verificationToken && (
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-bold">2</span>
              Add TXT Record (Verification)
            </h3>
            <p className="text-sm text-muted-foreground">
              This verifies you own the domain.
            </p>
            <div className="bg-muted border border-border p-4 rounded-xl space-y-2 text-sm font-mono">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-muted-foreground text-xs uppercase tracking-wider">Type:</span>
                  <p className="font-semibold text-sky-600 dark:text-sky-400">TXT</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs uppercase tracking-wider">Name:</span>
                  <p className="font-semibold text-foreground break-all">{txtRecordName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs uppercase tracking-wider">Value:</span>
                  <p className="font-semibold text-foreground break-all">{verificationToken}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Important Notes */}
        <Alert className="border-primary/30 bg-primary/10 rounded-xl">
          <AlertTriangle className="h-4 w-4 text-primary" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold text-primary">Important Notes</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>DNS changes can take up to 48 hours to propagate (usually 5-30 minutes)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Make sure to remove any conflicting A or CNAME records for this subdomain</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>If using Cloudflare, ensure the DNS proxy (orange cloud) is disabled for the CNAME record</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>SSL certificate will be automatically provisioned after verification</span>
                </li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Provider-Specific Instructions */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Provider-Specific Guides</h3>
          <div className="space-y-2 text-sm">
            <details className="group border border-border rounded-xl bg-muted overflow-hidden">
              <summary className="cursor-pointer font-medium text-foreground p-4 flex items-center justify-between hover:bg-muted/80 transition-colors">
                <span>GoDaddy</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <ol className="list-decimal list-inside space-y-1 px-4 pb-4 text-muted-foreground">
                <li>Log in to your GoDaddy account</li>
                <li>Go to My Products → Domains → DNS</li>
                <li>Click &quot;Add&quot; and select &quot;CNAME&quot; from the dropdown</li>
                <li>Enter the Name and Value as shown above</li>
                <li>Repeat for the TXT record</li>
              </ol>
            </details>

            <details className="group border border-border rounded-xl bg-muted overflow-hidden">
              <summary className="cursor-pointer font-medium text-foreground p-4 flex items-center justify-between hover:bg-muted/80 transition-colors">
                <span>Cloudflare</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <ol className="list-decimal list-inside space-y-1 px-4 pb-4 text-muted-foreground">
                <li>Log in to Cloudflare and select your domain</li>
                <li>Go to DNS → Records</li>
                <li>Click &quot;Add record&quot; and select &quot;CNAME&quot;</li>
                <li>Enter the Name and Target as shown above</li>
                <li>Turn OFF the proxy (click the orange cloud to make it gray)</li>
                <li>Repeat for the TXT record</li>
              </ol>
            </details>

            <details className="group border border-border rounded-xl bg-muted overflow-hidden">
              <summary className="cursor-pointer font-medium text-foreground p-4 flex items-center justify-between hover:bg-muted/80 transition-colors">
                <span>Namecheap</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <ol className="list-decimal list-inside space-y-1 px-4 pb-4 text-muted-foreground">
                <li>Log in to Namecheap</li>
                <li>Go to Domain List → Manage → Advanced DNS</li>
                <li>Click &quot;Add New Record&quot;</li>
                <li>Select &quot;CNAME Record&quot; and enter the details</li>
                <li>Repeat for the TXT record</li>
              </ol>
            </details>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
