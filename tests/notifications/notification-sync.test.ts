import {
  closeNotificationSyncChannels,
  createNotificationSyncSource,
  publishNotificationChange,
  subscribeNotificationChanges,
  type NotificationSyncMessage,
} from '@/lib/notifications/notification-sync'

/** BroadcastChannel delivers asynchronously, even inside one process. */
const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 30))

afterEach(() => {
  closeNotificationSyncChannels()
})

describe('notification sync, same tab', () => {
  it('delivers a change to a subscriber of the same scope', () => {
    const received: NotificationSyncMessage[] = []
    const off = subscribeNotificationChanges('admin', (m) => received.push(m))

    publishNotificationChange('admin', 'page', { type: 'read', id: 'n1' })

    expect(received).toEqual([{ source: 'page', change: { type: 'read', id: 'n1' } }])
    off()
  })

  it('skips messages from the subscriber\'s own source', () => {
    const received: NotificationSyncMessage[] = []
    const off = subscribeNotificationChanges('admin', (m) => received.push(m), {
      ignoreSource: 'bell',
    })

    publishNotificationChange('admin', 'bell', { type: 'read-all' })
    publishNotificationChange('admin', 'page', { type: 'deleted', id: 'n2' })

    expect(received.map((m) => m.source)).toEqual(['page'])
    off()
  })

  it('keeps admin and vendor scopes apart', () => {
    const admin: NotificationSyncMessage[] = []
    const vendor: NotificationSyncMessage[] = []
    const offA = subscribeNotificationChanges('admin', (m) => admin.push(m))
    const offV = subscribeNotificationChanges('vendor', (m) => vendor.push(m))

    publishNotificationChange('vendor', 'page', { type: 'purged' })

    expect(admin).toHaveLength(0)
    expect(vendor).toHaveLength(1)
    offA()
    offV()
  })

  it('stops delivering after unsubscribe', () => {
    const received: NotificationSyncMessage[] = []
    const off = subscribeNotificationChanges('admin', (m) => received.push(m))
    off()

    publishNotificationChange('admin', 'page', { type: 'read', id: 'n1' })

    expect(received).toHaveLength(0)
  })

  it('keeps delivering to other subscribers when one listener throws', () => {
    const received: NotificationSyncMessage[] = []
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const offBad = subscribeNotificationChanges('admin', () => {
      throw new Error('boom')
    })
    const offGood = subscribeNotificationChanges('admin', (m) => received.push(m))

    publishNotificationChange('admin', 'page', { type: 'read-all', category: 'booking' })

    expect(received).toHaveLength(1)
    offBad()
    offGood()
    errorSpy.mockRestore()
  })
})

describe('notification sync, other tabs', () => {
  it('receives a change posted by another tab', async () => {
    const received: NotificationSyncMessage[] = []
    const off = subscribeNotificationChanges('admin', (m) => received.push(m))

    const otherTab = new BroadcastChannel('notifications-sync:admin')
    otherTab.postMessage({ source: 'tab-2', change: { type: 'deleted', id: 'n9' } })
    await flush()
    otherTab.close()

    expect(received).toEqual([{ source: 'tab-2', change: { type: 'deleted', id: 'n9' } }])
    off()
  })

  it('sends a change to another tab', async () => {
    const otherTab = new BroadcastChannel('notifications-sync:vendor')
    const seen: unknown[] = []
    otherTab.onmessage = (e: MessageEvent) => seen.push(e.data)

    publishNotificationChange('vendor', 'bell', { type: 'read', id: 'n3' })
    await flush()
    otherTab.close()

    expect(seen).toEqual([{ source: 'bell', change: { type: 'read', id: 'n3' } }])
  })

  it('does not hear its own broadcast twice in the same tab', async () => {
    const received: NotificationSyncMessage[] = []
    const off = subscribeNotificationChanges('admin', (m) => received.push(m))

    publishNotificationChange('admin', 'page', { type: 'read', id: 'n1' })
    await flush()

    expect(received).toHaveLength(1)
    off()
  })

  it.each([
    ['not an object', 'hello'],
    ['missing source', { change: { type: 'read', id: 'x' } }],
    ['unknown type', { source: 's', change: { type: 'wipe' } }],
    ['read without id', { source: 's', change: { type: 'read' } }],
    ['category not a string', { source: 's', change: { type: 'read-all', category: 5 } }],
  ])('ignores a malformed message from another tab (%s)', async (_label, data) => {
    const received: NotificationSyncMessage[] = []
    const off = subscribeNotificationChanges('admin', (m) => received.push(m))

    const otherTab = new BroadcastChannel('notifications-sync:admin')
    otherTab.postMessage(data)
    await flush()
    otherTab.close()

    expect(received).toHaveLength(0)
    off()
  })
})

describe('createNotificationSyncSource', () => {
  it('returns distinct ids', () => {
    const ids = new Set(Array.from({ length: 50 }, () => createNotificationSyncSource()))
    expect(ids.size).toBe(50)
  })
})
