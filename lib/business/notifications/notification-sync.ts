/**
 * Keeps the business notification bell and the notifications page in step.
 *
 * The two hold separate copies of the same rows, and the realtime channel only
 * carries INSERTs, so a read or a delete made in one never reached the other until
 * a reload. Whichever side makes a change announces it here and the other catches up.
 *
 * - Same tab: an in-memory EventTarget shared by every importer of this module.
 * - Other tabs: one BroadcastChannel, which never delivers its own posts back to
 *   itself, so the same tab does not hear a change twice.
 *
 * Business module copy on purpose; admin and vendor have their own in
 * lib/notifications/notification-sync.ts. The channel names differ, so the portals
 * never hear each other.
 */

export type BusinessNotificationChange =
  | { type: 'read'; id: string }
  | { type: 'read-all'; category?: string }
  | { type: 'deleted'; id: string }
  | { type: 'cleared-read'; category?: string };

export interface BusinessNotificationSyncMessage {
  source: string;
  change: BusinessNotificationChange;
}

interface SubscribeOptions {
  /** Skip messages this source published itself. */
  ignoreSource?: string;
}

const CHANNEL_NAME = 'business-notifications-sync';
const local = new EventTarget();
let channel: BroadcastChannel | null | undefined;

/** Messages from other tabs are checked before use; anything else is dropped. */
function isSyncMessage(value: unknown): value is BusinessNotificationSyncMessage {
  if (typeof value !== 'object' || value === null) return false;
  const { source, change } = value as { source?: unknown; change?: unknown };
  if (typeof source !== 'string' || typeof change !== 'object' || change === null) return false;

  const c = change as { type?: unknown; id?: unknown; category?: unknown };
  switch (c.type) {
    case 'read':
    case 'deleted':
      return typeof c.id === 'string';
    case 'read-all':
    case 'cleared-read':
      return c.category === undefined || typeof c.category === 'string';
    default:
      return false;
  }
}

function dispatchLocal(message: BusinessNotificationSyncMessage): void {
  local.dispatchEvent(new CustomEvent(CHANNEL_NAME, { detail: message }));
}

/** Lazily opens the channel and forwards other tabs' messages locally. */
function getChannel(): BroadcastChannel | null {
  if (channel !== undefined) return channel;

  channel = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const opened = new BroadcastChannel(CHANNEL_NAME);
      opened.onmessage = (event: MessageEvent) => {
        if (isSyncMessage(event.data)) dispatchLocal(event.data);
      };
      channel = opened;
    } catch (error) {
      console.error('[business-notification-sync] BroadcastChannel unavailable:', error);
    }
  }
  return channel;
}

/** A per-instance id, so a component can ignore its own announcements. */
export function createBusinessNotificationSyncSource(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function publishBusinessNotificationChange(
  source: string,
  change: BusinessNotificationChange
): void {
  const message: BusinessNotificationSyncMessage = { source, change };
  dispatchLocal(message);

  try {
    getChannel()?.postMessage(message);
  } catch (error) {
    console.error('[business-notification-sync] failed to notify other tabs:', error);
  }
}

/** Returns the unsubscribe function. */
export function subscribeBusinessNotificationChanges(
  listener: (message: BusinessNotificationSyncMessage) => void,
  options: SubscribeOptions = {}
): () => void {
  getChannel();

  const handler = (event: Event): void => {
    const message = (event as CustomEvent<BusinessNotificationSyncMessage>).detail;
    if (!message || message.source === options.ignoreSource) return;
    try {
      listener(message);
    } catch (error) {
      // One broken listener must not stop the bell or the page from updating.
      console.error('[business-notification-sync] listener failed:', error);
    }
  };

  local.addEventListener(CHANNEL_NAME, handler);
  return () => local.removeEventListener(CHANNEL_NAME, handler);
}

/** Closes the channel. Used by tests; harmless anywhere else. */
export function closeBusinessNotificationSyncChannel(): void {
  channel?.close();
  channel = undefined;
}
