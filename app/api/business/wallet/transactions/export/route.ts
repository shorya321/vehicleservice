/**
 * Transaction Export API
 * Export transactions to CSV with filtering
 */

import { NextRequest } from 'next/server';
import { requireBusinessAuth, apiError } from '@/lib/business/api-utils';

/**
 * GET /api/business/wallet/transactions/export
 * Export transactions to CSV
 */
export const GET = requireBusinessAuth(async (request: NextRequest, user) => {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);

    // Filters
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const transactionTypes = searchParams.get('transaction_types'); // Comma-separated
    const currency = searchParams.get('currency');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10000'), 10000); // Max 10k

    // Call export_transactions function
    const { data: transactions, error } = await supabase.rpc('export_transactions', {
      p_business_account_id: user.businessAccountId,
      p_start_date: startDate || null,
      p_end_date: endDate || null,
      p_transaction_types: transactionTypes ? transactionTypes.split(',') : null,
      p_currency: currency || null,
      p_limit: limit,
    });

    if (error) {
      console.error('Error exporting transactions:', error);
      return apiError('Failed to export transactions', 500);
    }

    // Generate CSV content
    const csvRows: string[] = [];

    // Headers
    csvRows.push([
      'Transaction ID',
      'Date & Time',
      'Type',
      'Description',
      'Amount',
      'Currency',
      'Balance After',
      'Reference ID',
      'Stripe Payment Intent ID',
      'Created By',
      'Original Amount',
      'Original Currency',
      'Exchange Rate',
    ].join(','));

    // Data rows
    for (const tx of transactions || []) {
      const row = [
        tx.transaction_id || '',
        tx.transaction_date ? new Date(tx.transaction_date).toISOString() : '',
        tx.transaction_type || '',
        `"${(tx.description || '').replace(/"/g, '""')}"`, // Escape quotes
        tx.amount || '',
        tx.currency || '',
        tx.balance_after || '',
        tx.reference_id || '',
        tx.stripe_payment_intent_id || '',
        tx.created_by || '',
        tx.original_amount || '',
        tx.original_currency || '',
        tx.exchange_rate || '',
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    let filename = `transactions_${timestamp}`;

    if (startDate) {
      filename += `_from_${startDate.split('T')[0]}`;
    }
    if (endDate) {
      filename += `_to_${endDate.split('T')[0]}`;
    }

    filename += '.csv';

    // Return CSV as response
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Transaction export error:', error);
    return apiError('Internal server error', 500);
  }
});
