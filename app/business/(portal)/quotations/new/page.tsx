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
import { ArrowLeft, UserRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getBusinessMember } from '@/lib/business/member-scope';
import { PortalSectionCard } from '@/app/business/(portal)/components/ui/section-card';
import { PageHeader } from '@/app/business/(portal)/components/ui/page-header';
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
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="New Quotation"
        breadcrumb={
          <nav className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href="/business/quotations"
              className="flex items-center gap-1.5 transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Quotations</span>
            </Link>
          </nav>
        }
        description={
          <>
            Start with who it is for. You will add trips next. Quoted in {currency} — the
            exchange rate is locked now, so a PDF you have already sent never changes value.
          </>
        }
      />

      <PortalSectionCard title="Customer &amp; terms" icon={UserRound}>
        <NewQuotationForm currency={currency} />
      </PortalSectionCard>
    </div>
  );
}
