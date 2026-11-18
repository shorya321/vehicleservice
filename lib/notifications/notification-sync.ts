/**
 * Keeps the notification bell and the notifications page in step.
 *
 * The two hold separate copies of the same rows, and the realtime channel only
 * carries INSERTs, so a read or a delete made in one never reached the other until
 * a reload. Whichever side makes a change announces it here and the other side
 * catches up.
 *
 * - Same tab: an in-memory EventTarget shared by every importer of this module.
 * - Other tabs: one BroadcastChannel per scope. A channel never delivers its own
 *   posts back to itself, so the same tab does not hear a change twice.
 *
 * Admin and vendor only. The business module keeps its own copy in
 * lib/business/notifications/notification-sync.ts.
 */
import type { NotificationCategory } from '@/lib/notifications/types';

export type NotificationSyncScope = 'admin' | 'vendor';

export type NotificationChange =
  | { type: 'read'; id: string }
  | { type: 'read-all'; category?: NotificationCategory }
  | { type: 'deleted'; id: string }
  | { type: 'cleared-read'; category?: NotificationCategory }
  | { type: 'purged' };

export interface NotificationSyncMessage {
  source: string;
  change: NotificationChange;
}

interface SubscribeOptions {
  /** Skip messages this source published itself. */
  ignoreSource?: string;
}

const CHANNEL_PREFIX = 'notifications-sync:';
const local = new EventTarget();
const channels = new Map<NotificationSyncScope, BroadcastChannel | null>();

function eventName(scope: NotificationSyncScope): string {
  return `${CHANNEL_PREFIX}${scope}`;
}

/** Messages from other tabs are checked before use; anything else is dropped. */
function isSyncMessage(value: unknown): value is NotificationSyncMessage {
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
    case 'purged':
      return true;
    default:
      return false;
  }
}

function dispatchLocal(scope: NotificationSyncScope, message: NotificationSyncMessage): void {
  local.dispatchEvent(new CustomEvent(eventName(scope), { detail: message }));
}

/** Lazily opens the scope's channel and forwards other tabs' messages locally. */
function channelFor(scope: NotificationSyncScope): BroadcastChannel | null {
  if (channels.has(scope)) return channels.get(scope) ?? null;

  let channel: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      channel = new BroadcastChannel(eventName(scope));
      channel.onmessage = (event: MessageEvent) => {
        if (isSyncMessage(event.data)) dispatchLocal(scope, event.data);
      };
    } catch (error) {
      console.error('[notification-sync] BroadcastChannel unavailable:', error);
      channel = null;
    }
  }
  channels.set(scope, channel);
  return channel;
}

/** A per-instance id, so a component can ignore its own announcements. */
export function createNotificationSyncSource(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function publishNotificationChange(
  scope: NotificationSyncScope,
  source: string,
  change: NotificationChange
): void {
  const message: NotificationSyncMessage = { source, change };
  dispatchLocal(scope, message);

  try {
    channelFor(scope)?.postMessage(message);
  } catch (error) {
    console.error('[notification-sync] failed to notify other tabs:', error);
  }
}

/** Returns the unsubscribe function. */
export function subscribeNotificationChanges(
  scope: NotificationSyncScope,
  listener: (message: NotificationSyncMessage) => void,
  options: SubscribeOptions = {}
): () => void {
  channelFor(scope);

  const handler = (event: Event): void => {
    const message = (event as CustomEvent<NotificationSyncMessage>).detail;
    if (!message || message.source === options.ignoreSource) return;
    try {
      listener(message);
    } catch (error) {
      // One broken listener must not stop the bell or the page from updating.
      console.error('[notification-sync] listener failed:', error);
    }
  };

  local.addEventListener(eventName(scope), handler);
  return () => local.removeEventListener(eventName(scope), handler);
}

/** Closes the open channels. Used by tests; harmless anywhere else. */
export function closeNotificationSyncChannels(): void {
  for (const channel of channels.values()) channel?.close();
  channels.clear();
}
