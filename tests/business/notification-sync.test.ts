import {
  closeBusinessNotificationSyncChannel,
  createBusinessNotificationSyncSource,
  publishBusinessNotificationChange,
  subscribeBusinessNotificationChanges,
  type BusinessNotificationSyncMessage,
} from '@/lib/business/notifications/notification-sync'

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 30))
const CHANNEL = 'business-notifications-sync'

afterEach(() => {
  closeBusinessNotificationSyncChannel()
})

describe('business notification sync, same tab', () => {
  it('delivers a change to a subscriber', () => {
    const received: BusinessNotificationSyncMessage[] = []
    const off = subscribeBusinessNotificationChanges((m) => received.push(m))

    publishBusinessNotificationChange('page', { type: 'read-all', category: 'payment' })

    expect(received).toEqual([{ source: 'page', change: { type: 'read-all', category: 'payment' } }])
    off()
  })

  it('skips its own source', () => {
    const received: BusinessNotificationSyncMessage[] = []
    const off = subscribeBusinessNotificationChanges((m) => received.push(m), {
      ignoreSource: 'bell',
    })

    publishBusinessNotificationChange('bell', { type: 'read', id: 'n1' })
    publishBusinessNotificationChange('page', { type: 'cleared-read' })

    expect(received.map((m) => m.change.type)).toEqual(['cleared-read'])
    off()
  })

  it('stops after unsubscribe', () => {
    const received: BusinessNotificationSyncMessage[] = []
    const off = subscribeBusinessNotificationChanges((m) => received.push(m))
    off()
    publishBusinessNotificationChange('page', { type: 'deleted', id: 'n1' })
    expect(received).toHaveLength(0)
  })

  it('isolates a throwing listener', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const received: BusinessNotificationSyncMessage[] = []
    const offBad = subscribeBusinessNotificationChanges(() => {
      throw new Error('boom')
    })
    const offGood = subscribeBusinessNotificationChanges((m) => received.push(m))

    publishBusinessNotificationChange('page', { type: 'read', id: 'n1' })

    expect(received).toHaveLength(1)
    offBad()
    offGood()
    errorSpy.mockRestore()
  })
})

describe('business notification sync, other tabs', () => {
  it('receives and sends across tabs', async () => {
    const received: BusinessNotificationSyncMessage[] = []
    const off = subscribeBusinessNotificationChanges((m) => received.push(m))
    const otherTab = new BroadcastChannel(CHANNEL)
    const seen: unknown[] = []
    otherTab.onmessage = (e: MessageEvent) => seen.push(e.data)

    otherTab.postMessage({ source: 'tab-2', change: { type: 'deleted', id: 'n9' } })
    publishBusinessNotificationChange('bell', { type: 'read', id: 'n3' })
    await flush()
    otherTab.close()

    expect(received.map((m) => m.source)).toEqual(['bell', 'tab-2'])
    expect(seen).toEqual([{ source: 'bell', change: { type: 'read', id: 'n3' } }])
    off()
  })

  it('does not share a channel with admin or vendor', async () => {
    const received: BusinessNotificationSyncMessage[] = []
    const off = subscribeBusinessNotificationChanges((m) => received.push(m))
    const adminTab = new BroadcastChannel('notifications-sync:admin')

    adminTab.postMessage({ source: 'x', change: { type: 'purged' } })
    await flush()
    adminTab.close()

    expect(received).toHaveLength(0)
    off()
  })

  it('ignores malformed messages', async () => {
    const received: BusinessNotificationSyncMessage[] = []
    const off = subscribeBusinessNotificationChanges((m) => received.push(m))
    const otherTab = new BroadcastChannel(CHANNEL)

    otherTab.postMessage({ source: 's', change: { type: 'deleted' } })
    otherTab.postMessage(null)
    otherTab.postMessage({ source: 1, change: { type: 'purged' } })
    await flush()
    otherTab.close()

    expect(received).toHaveLength(0)
    off()
  })

  it('creates distinct sources', () => {
    expect(createBusinessNotificationSyncSource()).not.toBe(createBusinessNotificationSyncSource())
  })
})
