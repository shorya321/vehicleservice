/**
 * Business Notification Inserts Hook
 * Calls onInsert for every notification created for this user while mounted.
 *
 * The business bell has its own realtime channel and shows the toast; this one
 * lets the notifications page keep its list and counts current. The topic includes
 * a per-instance key so it never shares (and breaks) the bell's channel, and the
 * join waits for the user's token (see subscribeBusinessRealtimeWithAuth).
 *
 * SCOPE: Business module ONLY
 */

'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { subscribeBusinessRealtimeWithAuth } from '@/lib/business/realtime/subscribe-with-auth';

interface InsertedRow {
  id: string;
  category: string;
}

export function useBusinessNotificationInserts<T extends InsertedRow>(
  userId: string,
  instanceKey: string,
  onInsert: (row: T) => void
): void {
  // Latest callback, so a new closure each render does not resubscribe.
  const onInsertRef = useRef(onInsert);
  useEffect(() => {
    onInsertRef.current = onInsert;
  }, [onInsert]);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    return subscribeBusinessRealtimeWithAuth(supabase, () =>
      supabase
        .channel(`business-notifications-page:${userId}:${instanceKey}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            onInsertRef.current(payload.new as T);
          }
        )
        .subscribe()
    );
  }, [userId, instanceKey]);
}
