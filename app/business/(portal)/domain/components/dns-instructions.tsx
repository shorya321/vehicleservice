/**
 * DNS Instructions Component
 * Display DNS configuration instructions
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Code } from 'lucide-react';
import { getVercelCNAME } from '@/lib/business/domain-utils';

interface DNSInstructionsProps {
  customDomain: string;
  verificationToken: string | null;
}

export function DNSInstructions({ customDomain, verificationToken }: DNSInstructionsProps) {
  const cnameTarget = getVercelCNAME();
  const txtRecordName = `_verify.${customDomain}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          DNS Configuration Instructions
        </CardTitle>
        <CardDescription>
          Add these DNS records to your domain provider (GoDaddy, Cloudflare, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: CNAME Record */}
        <div className="space-y-3">
          <h3 className="font-semibold">Step 1: Add CNAME Record</h3>
          <p className="text-sm text-muted-foreground">
            This points your custom domain to our service.
          </p>
          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm font-mono">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-muted-foreground">Type:</span>
                <p className="font-semibold">CNAME</p>
              </div>
              <div>
                <span className="text-muted-foreground">Name:</span>
                <p className="font-semibold break-all">{customDomain.split('.')[0]}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Value:</span>
                <p className="font-semibold break-all">{cnameTarget}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: TXT Record for Verification */}
        {verificationToken && (
          <div className="space-y-3">
            <h3 className="font-semibold">Step 2: Add TXT Record (Verification)</h3>
            <p className="text-sm text-muted-foreground">
              This verifies you own the domain.
            </p>
            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm font-mono">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <p className="font-semibold">TXT</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <p className="font-semibold break-all">{txtRecordName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Value:</span>
                  <p className="font-semibold break-all">{verificationToken}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Important Notes */}
        <Alert>
          <AlertTitle>Important Notes</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
              <li>DNS changes can take up to 48 hours to propagate (usually 5-30 minutes)</li>
              <li>Make sure to remove any conflicting A or CNAME records for this subdomain</li>
              <li>
                If using Cloudflare, ensure the DNS proxy (orange cloud) is disabled for the
                CNAME record
              </li>
              <li>SSL certificate will be automatically provisioned after verification</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Provider-Specific Instructions */}
        <div className="space-y-3">
          <h3 className="font-semibold">Provider-Specific Guides</h3>
          <div className="space-y-2 text-sm">
            <details className="border rounded-lg p-3">
              <summary className="cursor-pointer font-medium">GoDaddy</summary>
              <ol className="list-decimal list-inside space-y-1 mt-2 text-muted-foreground">
                <li>Log in to your GoDaddy account</li>
                <li>Go to My Products → Domains → DNS</li>
                <li>Click "Add" and select "CNAME" from the dropdown</li>
                <li>Enter the Name and Value as shown above</li>
                <li>Repeat for the TXT record</li>
              </ol>
            </details>

            <details className="border rounded-lg p-3">
              <summary className="cursor-pointer font-medium">Cloudflare</summary>
              <ol className="list-decimal list-inside space-y-1 mt-2 text-muted-foreground">
                <li>Log in to Cloudflare and select your domain</li>
                <li>Go to DNS → Records</li>
                <li>Click "Add record" and select "CNAME"</li>
                <li>Enter the Name and Target as shown above</li>
                <li>Turn OFF the proxy (click the orange cloud to make it gray)</li>
                <li>Repeat for the TXT record</li>
              </ol>
            </details>

            <details className="border rounded-lg p-3">
              <summary className="cursor-pointer font-medium">Namecheap</summary>
              <ol className="list-decimal list-inside space-y-1 mt-2 text-muted-foreground">
                <li>Log in to Namecheap</li>
                <li>Go to Domain List → Manage → Advanced DNS</li>
                <li>Click "Add New Record"</li>
                <li>Select "CNAME Record" and enter the details</li>
                <li>Repeat for the TXT record</li>
              </ol>
            </details>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
