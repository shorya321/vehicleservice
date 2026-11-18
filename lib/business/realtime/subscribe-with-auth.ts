/**
 * Subscribes to a realtime channel only once the user's token is on the socket.
 *
 * Why: in realtime-js 2.15 the socket starts fetching the token when it connects,
 * but a channel joins straight away. The join goes out without a token, and the
 * follow-up setAuth after the join sees the token unchanged and pushes nothing,
 * so the channel stays joined as anon. Row level security then hides every row
 * and postgres_changes never delivers an event. Awaiting setAuth first puts the
 * token in the join payload. Later token refreshes are pushed by the heartbeat.
 *
 * Cleanup uses removeChannel, not channel.unsubscribe: unsubscribe leaves the
 * channel in the client's list, and the next supabase.channel(sameName), as in a
 * Strict Mode remount, returns that leaving channel, whose subscribe() is a no-op.
 *
 * Business module copy on purpose; admin, vendor and customer use
 * lib/supabase/subscribe-with-auth.ts.
 *
 * Returns the cleanup function for a useEffect.
 */

export interface BusinessRealtimeAuthClient<C> {
  realtime: { setAuth: () => Promise<void> };
  removeChannel: (channel: C) => Promise<unknown>;
}

export function subscribeBusinessRealtimeWithAuth<C>(
  client: BusinessRealtimeAuthClient<C>,
  subscribe: () => C
): () => void {
  let cancelled = false;
  let channel: C | null = null;

  client.realtime
    .setAuth()
    .catch((error: unknown) => {
      // Subscribe anyway: without the token it behaves as before, no worse.
      console.error('[business-realtime] could not set auth before subscribing:', error);
    })
    .then(() => {
      if (cancelled) return;
      channel = subscribe();
    });

  return () => {
    if (cancelled) return;
    cancelled = true;
    if (channel !== null) {
      void client.removeChannel(channel);
      channel = null;
    }
  };
}
