/**
 * New Quotation
 *
 * Captures the header only, then creates the draft row and redirects to the detail page where
 * trips are added. Creating the row up front means the quotation number exists immediately
 * and no work is lost to a closed tab.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getBusinessMember } from '@/lib/business/member-scope';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NewQuotationForm } from './components/new-quotation-form';

export const metadata: Metadata = {
  title: 'New Quotation | Business Portal',
  description: 'Start a priced proposal for your customer',
};

export default async function NewQuotationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/business/login');

  const member = await getBusinessMember(supabase, user.id);
  if (!member) redirect('/business/login');

  // preferred_currency is the DISPLAY currency; `currency` is the wallet currency and is
  // always AED. The quotation is quoted in the former.
  const { data: account } = await supabase
    .from('business_accounts')
    .select('preferred_currency, currency')
    .eq('id', member.businessAccountId)
    .single();

  const currency = account?.preferred_currency || account?.currency || 'AED';

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/business/quotations" aria-label="Back to quotations">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New Quotation</h1>
          <p className="text-sm text-muted-foreground">
            Start with who it is for. You will add trips next.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer &amp; terms</CardTitle>
          <CardDescription>
            Quoted in {currency}. The exchange rate is locked now, so a PDF you have already
            sent never changes value.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewQuotationForm currency={currency} />
        </CardContent>
      </Card>
    </div>
  );
}
