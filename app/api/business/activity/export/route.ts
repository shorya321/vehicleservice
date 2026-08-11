/**
 * Activity CSV export.
 *
 * Owner only. Parity with the wallet transactions export the owner already has,
 * and the real jobs (dispute evidence, insurance requests, reconciliation) all
 * end in a spreadsheet. The log is also the only surviving record of a
 * hard-deleted staff member, so a portable copy has standalone value.
 */

import { after, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusinessOwner, apiError } from '@/lib/business/api-utils';
import { activityLogger } from '@/lib/business/activity/log';
import {
  renderActivityMessage,
  activityMessageToText,
} from '@/lib/business/activity/messages';
import { mapActivityRow, parseActivityFilters, applyActivityFilters } from '../query';

// Matches the wallet transactions export cap.
const MAX_ROWS = 10000;

/**
 * Escape one CSV cell.
 *
 * A cell starting with =, +, - or @ is executed as a formula by Excel and
 * Sheets. This log contains user-supplied business, customer and passenger
 * names, so that is a live injection path, not a theoretical one.
 */
function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${guarded.replace(/"/g, '""')}"`;
}

export const GET = requireBusinessOwner(async (request: Request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = await createClient();

    let query = supabase
      .from('business_activity_logs')
      .select('*')
      .eq('business_account_id', user.businessAccountId);

    query = applyActivityFilters(query, parseActivityFilters(searchParams, user));

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(MAX_ROWS);

    if (error) {
      console.error('Failed to export activity:', error);
      return apiError('Failed to export activity', 500);
    }

    const events = (data ?? []).map(mapActivityRow);

    const header = [
      'Timestamp (UTC)', 'Local Time', 'Category', 'Severity', 'Action',
      'Actor', 'Actor Type', 'Message', 'Entity Type', 'Entity Reference',
      'Amount', 'Currency', 'IP Address', 'Details',
    ];

    const rows = events.map((event) => {
      // The same renderer the UI uses, flattened to text. One source of truth
      // for the sentence, two consumers.
      const message = activityMessageToText(renderActivityMessage(event));
      const details = { ...event.metadata, ...(event.changes ? { changes: event.changes } : {}) };

      return [
        event.createdAt,
        new Date(event.createdAt).toLocaleString('en-GB', { timeZone: 'Asia/Dubai' }),
        event.category,
        event.severity,
        event.action,
        event.actorName,
        event.actorType,
        message,
        event.entityType ?? '',
        event.entityLabel ?? '',
        event.amount ?? '',
        event.currency ?? '',
        event.ipAddress ?? '',
        JSON.stringify(details),
      ].map(csvCell).join(',');
    });

    const csv = [header.map(csvCell).join(','), ...rows].join('\n');
    // A download filename, not a displayed date, so the UTC day is fine here.
    // eslint-disable-next-line no-restricted-syntax
    const filename = `activity_${new Date().toISOString().split('T')[0]}.csv`;

    // Exporting the audit log is itself a data movement event and belongs in
    // the audit log. after() keeps the download from waiting on the write while
    // still guaranteeing it survives the response returning.
    after(
      activityLogger(user, request)('document.activity_exported', {
        metadata: {
          count: events.length,
          period_start: searchParams.get('from'),
          period_end: searchParams.get('to'),
          filters_applied: Boolean(
            searchParams.get('categories') ||
              searchParams.get('severities') ||
              searchParams.get('search') ||
              searchParams.get('actor')
          ),
        },
      })
    );

    // NextResponse rather than a bare Response so this satisfies the
    // requireBusinessOwner handler type without a cast.
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Activity export error:', error);
    return apiError('Failed to export activity', 500);
  }
});
