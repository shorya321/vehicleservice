/**
 * Monthly Statement PDF Download API
 * GET: Generate and download monthly wallet statement as PDF
 */

import { NextRequest, after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusinessOwner, apiError } from '@/lib/business/api-utils';
import { activityLogger } from '@/lib/business/activity/log';
import { MonthlyStatementPDF } from '@/lib/pdf/generators/monthly-statement';
import { generatePDFBuffer, getPDFDownloadHeaders } from '@/lib/pdf/utils/pdf-generator';
import { bookingWallClockToUtc, formatBookingDate, formatBookingDateTime } from '@/lib/business/utils/timezone';
import { jsx } from 'react/jsx-runtime';

/**
 * GET: Generate and download monthly statement PDF
 */
export const GET = requireBusinessOwner(async (
  request: NextRequest,
  user,
  context: { params: Promise<{ year: string; month: string }> }
) => {
  try {
    const { year: yearParam, month: monthParam } = await context.params;
    const supabase = await createClient();

    // Validate year and month parameters
    const year = parseInt(yearParam);
    const month = parseInt(monthParam);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return apiError('Invalid year or month parameter', 400);
    }

    // Get business account. The address column is `address`, not
    // `business_address` - selecting the latter made this route always 404.
    const { data: businessAccount, error: businessError } = await supabase
      .from('business_accounts')
      .select('id, business_name, business_email, business_phone, address, currency')
      .eq('id', user.businessAccountId)
      .single();

    if (businessError || !businessAccount) {
      return apiError('Business account not found', 404);
    }

    // The statement covers a Dubai calendar month, so both edges are resolved
    // as Dubai midnight. `new Date(year, month - 1, 1)` would instead resolve
    // in the server's zone, which is UTC on Vercel, and file everything in the
    // first four hours of the 1st under the previous month's statement.
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const nextMonthStart =
      month === 12
        ? `${year + 1}-01-01`
        : `${year}-${String(month + 1).padStart(2, '0')}-01`;

    const startDate = bookingWallClockToUtc(monthStart, '00:00');
    // Half-open: an inclusive `lte` against the month's final instant is what
    // drops transactions in the last second of the period.
    const endDateExclusive = bookingWallClockToUtc(nextMonthStart, '00:00');
    // The last Dubai day actually covered, for display only.
    const lastDayOfPeriod = new Date(endDateExclusive.getTime() - 1);

    // Get all transactions for the statement period
    const { data: transactions, error: transactionsError } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('business_account_id', businessAccount.id)
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDateExclusive.toISOString())
      .order('created_at', { ascending: true });

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
      return apiError('Failed to fetch transactions', 500);
    }

    // Get opening balance (last transaction before statement period)
    const { data: previousTransactions } = await supabase
      .from('wallet_transactions')
      .select('balance_after')
      .eq('business_account_id', businessAccount.id)
      .lt('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    const openingBalance = previousTransactions?.[0]?.balance_after || 0;

    // Calculate closing balance (last transaction in period or opening balance)
    const closingBalance =
      transactions && transactions.length > 0
        ? transactions[transactions.length - 1].balance_after
        : openingBalance;

    // Calculate totals
    let totalCredits = 0;
    let totalDebits = 0;

    transactions?.forEach((transaction) => {
      if (transaction.transaction_type === 'credit') {
        totalCredits += Math.abs(transaction.amount);
      } else if (transaction.transaction_type === 'debit') {
        totalDebits += Math.abs(transaction.amount);
      }
    });

    // Format transactions for PDF
    const formattedTransactions = (transactions || []).map((transaction) => ({
      id: transaction.id,
      date: formatBookingDate(transaction.created_at, 'PP'),
      description: transaction.description || 'Wallet transaction',
      type: transaction.transaction_type as 'credit' | 'debit',
      amount: transaction.amount,
      balance: transaction.balance_after,
    }));

    // Prepare PDF data
    const pdfData = {
      // Business Information
      businessName: businessAccount.business_name,
      businessEmail: businessAccount.business_email,
      businessPhone: businessAccount.business_phone,
      businessAddress: businessAccount.address,

      // Statement Period
      statementMonth: formatBookingDate(startDate, 'MMMM'),
      statementYear: year,
      startDate: formatBookingDate(startDate, 'PP'),
      endDate: formatBookingDate(lastDayOfPeriod, 'PP'),

      // Summary
      openingBalance,
      closingBalance,
      totalCredits,
      totalDebits,
      transactionCount: transactions?.length || 0,
      currency: businessAccount.currency || 'AED',

      // Transactions
      transactions: formattedTransactions,

      // Metadata
      statementId: `${businessAccount.id}-${year}-${month.toString().padStart(2, '0')}`,
      generatedDate: formatBookingDateTime(new Date(), 'PPp'),
    };

    // Generate PDF
    const pdfBuffer = await generatePDFBuffer(jsx(MonthlyStatementPDF, pdfData));

    // Return PDF with download headers
    const fileName = `statement-${year}-${month.toString().padStart(2, '0')}`;
    const headers = getPDFDownloadHeaders(fileName);

    // after() keeps the PDF from waiting on the log write, while still
    // guaranteeing the write survives the response returning.
    after(
      activityLogger(user, request)('document.statement_generated', {
        metadata: {
          period_label: `${year}-${month.toString().padStart(2, '0')}`,
          period_start: startDate.toISOString(),
          period_end: endDateExclusive.toISOString(),
          transaction_count: formattedTransactions.length,
        },
      })
    );

    return new Response(pdfBuffer, {
      headers,
    });
  } catch (error) {
    console.error('Error generating monthly statement:', error);
    return apiError('Failed to generate monthly statement', 500);
  }
});
