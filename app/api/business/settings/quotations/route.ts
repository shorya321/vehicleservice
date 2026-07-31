/**
 * Business Quotation Settings API
 * Owner-only control over the prefix used when issuing quotation numbers.
 */

import { requireBusinessOwner, apiSuccess, apiError } from '@/lib/business/api-utils';
import { createClient } from '@supabase/supabase-js';
import { businessQuotationSettingsSchema } from '@/lib/business/validators';

/** Platform fallback, matching the DEFAULT on business_accounts.quotation_number_prefix. */
const DEFAULT_QUOTATION_PREFIX = 'QUO';

interface QuotationSettingsUpdate {
  quotation_number_prefix: string;
  updated_at: string;
}

/**
 * GET /api/business/settings/quotations
 * Read the current quotation numbering settings.
 */
export const GET = requireBusinessOwner(async (_request: Request, user) => {
  try {
    const { createClient: createSupabaseClient } = await import('@/lib/supabase/server');
    const supabase = await createSupabaseClient();

    const { data: settings, error } = await supabase
      .from('business_accounts')
      .select('quotation_number_prefix')
      .eq('id', user.businessAccountId)
      .single();

    if (error) {
      console.error('Error fetching quotation settings:', error);
      return apiError('Failed to fetch quotation settings', 500);
    }

    return apiSuccess({
      settings: {
        quotation_number_prefix: settings.quotation_number_prefix || DEFAULT_QUOTATION_PREFIX,
      },
    });
  } catch (error) {
    console.error('Quotation settings fetch error:', error);
    return apiError('Failed to fetch quotation settings', 500);
  }
});

/**
 * PATCH /api/business/settings/quotations
 * Update the quotation number prefix.
 *
 * Only newly issued quotations are affected - existing quotation_number values
 * are stored strings and are never rewritten. The per-month counter is left
 * alone, so a mid-month change continues the sequence.
 */
export const PATCH = requireBusinessOwner(async (request: Request, user) => {
  try {
    const body: unknown = await request.json();

    // Normalise before validating so 'acme' is accepted and stored as 'ACME'.
    const rawPrefix =
      typeof body === 'object' && body !== null && 'quotation_number_prefix' in body
        ? (body as { quotation_number_prefix: unknown }).quotation_number_prefix
        : undefined;

    const validation = businessQuotationSettingsSchema.safeParse({
      quotation_number_prefix:
        typeof rawPrefix === 'string' ? rawPrefix.trim().toUpperCase() : rawPrefix,
    });

    if (!validation.success) {
      return apiError(
        validation.error.issues[0]?.message ?? 'Invalid quotation prefix',
        400
      );
    }

    const updates: QuotationSettingsUpdate = {
      quotation_number_prefix: validation.data.quotation_number_prefix,
      updated_at: new Date().toISOString(),
    };

    // Service-role client: tenant scope comes from the session, never the body.
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: updated, error } = await supabaseAdmin
      .from('business_accounts')
      .update(updates)
      .eq('id', user.businessAccountId)
      .select('quotation_number_prefix')
      .single();

    if (error) {
      console.error('Error updating quotation settings:', error);
      return apiError('Failed to update quotation settings', 500);
    }

    return apiSuccess({
      message: 'Quotation settings updated successfully',
      settings: {
        quotation_number_prefix: updated.quotation_number_prefix,
      },
    });
  } catch (error) {
    console.error('Quotation settings update error:', error);
    return apiError('Failed to update quotation settings', 500);
  }
});
