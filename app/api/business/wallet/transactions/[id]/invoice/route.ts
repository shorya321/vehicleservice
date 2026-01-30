/**
 * Transaction Invoice PDF Download API
 * GET: Generate and download transaction invoice as PDF
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/business/api-utils';
import { TransactionInvoicePDF } from '@/lib/pdf/generators/transaction-invoice';
import { generatePDFBuffer, getPDFDownloadHeaders } from '@/lib/pdf/utils/pdf-generator';
import { format } from 'date-fns';
import { jsx } from 'react/jsx-runtime';

/**
 * GET: Generate and download transaction invoice PDF
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('Unauthorized', 401);
    }

    // Get business account
    const { data: businessAccount, error: businessError } = await supabase
      .from('business_accounts')
      .select('id, business_name, business_email, business_phone, business_address')
      .eq('id', user.id)
      .single();

    if (businessError || !businessAccount) {
      return apiError('Business account not found', 404);
    }

    // Get transaction details
    const { data: transaction, error: transactionError } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('id', id)
      .eq('business_account_id', businessAccount.id)
      .single();

    if (transactionError || !transaction) {
      return apiError('Transaction not found', 404);
    }

    // Get balance before this transaction
    const { data: previousTransactions } = await supabase
      .from('wallet_transactions')
      .select('balance_after')
      .eq('business_account_id', businessAccount.id)
      .lt('created_at', transaction.created_at)
      .order('created_at', { ascending: false })
      .limit(1);

    const previousBalance = previousTransactions?.[0]?.balance_after || 0;

    // Prepare PDF data
    const pdfData = {
      // Business Information
      businessName: businessAccount.business_name,
      businessEmail: businessAccount.business_email,
      businessPhone: businessAccount.business_phone,
      businessAddress: businessAccount.business_address,

      // Transaction Details
      transactionId: transaction.id,
      transactionType: transaction.transaction_type as 'credit' | 'debit',
      amount: Math.abs(transaction.amount),
      currency: transaction.currency,
      description: transaction.description || 'Wallet transaction',
      previousBalance,
      newBalance: transaction.balance_after,
      transactionDate: format(new Date(transaction.created_at), 'PPp'),
      paymentMethod: transaction.payment_method || 'N/A',
      referenceId: transaction.reference_id,

      // Metadata
      generatedDate: format(new Date(), 'PPp'),
    };

    // Generate PDF
    const pdfBuffer = await generatePDFBuffer(jsx(TransactionInvoicePDF, pdfData));

    // Return PDF with download headers
    const fileName = `invoice-${transaction.id.substring(0, 8)}`;
    const headers = getPDFDownloadHeaders(fileName);

    return new Response(pdfBuffer, {
      headers,
    });
  } catch (error) {
    console.error('Error generating transaction invoice:', error);
    return apiError('Failed to generate transaction invoice', 500);
  }
}
