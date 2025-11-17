/**
 * Monthly Statement PDF Download API
 * GET: Generate and download monthly wallet statement as PDF
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/business/api-utils';
import { MonthlyStatementPDF } from '@/lib/pdf/generators/monthly-statement';
import { generatePDFBuffer, getPDFDownloadHeaders } from '@/lib/pdf/utils/pdf-generator';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { jsx } from 'react/jsx-runtime';

/**
 * GET: Generate and download monthly statement PDF
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { year: string; month: string } }
) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('Unauthorized', 401);
    }

    // Validate year and month parameters
    const year = parseInt(params.year);
    const month = parseInt(params.month);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return apiError('Invalid year or month parameter', 400);
    }

    // Get business account
    const { data: businessAccount, error: businessError } = await supabase
      .from('business_accounts')
      .select('id, business_name, business_email, business_phone, business_address, currency')
      .eq('id', user.id)
      .single();

    if (businessError || !businessAccount) {
      return apiError('Business account not found', 404);
    }

    // Calculate statement period dates
    const statementDate = new Date(year, month - 1, 1);
    const startDate = startOfMonth(statementDate);
    const endDate = endOfMonth(statementDate);

    // Get all transactions for the statement period
    const { data: transactions, error: transactionsError } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('business_account_id', businessAccount.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
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
      date: format(new Date(transaction.created_at), 'PP'),
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
      businessAddress: businessAccount.business_address,

      // Statement Period
      statementMonth: format(statementDate, 'MMMM'),
      statementYear: year,
      startDate: format(startDate, 'PP'),
      endDate: format(endDate, 'PP'),

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
      generatedDate: format(new Date(), 'PPp'),
    };

    // Generate PDF
    const pdfBuffer = await generatePDFBuffer(jsx(MonthlyStatementPDF, pdfData));

    // Return PDF with download headers
    const fileName = `statement-${year}-${month.toString().padStart(2, '0')}`;
    const headers = getPDFDownloadHeaders(fileName);

    return new Response(pdfBuffer, {
      headers,
    });
  } catch (error) {
    console.error('Error generating monthly statement:', error);
    return apiError('Failed to generate monthly statement', 500);
  }
}
