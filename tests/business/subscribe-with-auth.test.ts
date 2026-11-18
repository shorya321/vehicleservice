import { subscribeBusinessRealtimeWithAuth as subscribeWithAuth, type BusinessRealtimeAuthClient as RealtimeAuthClient } from '@/lib/business/realtime/subscribe-with-auth'

type FakeChannel = { name: string }

function fakeClient(setAuth: () => Promise<void>) {
  const removed: FakeChannel[] = []
  const client = {
    realtime: { setAuth: jest.fn(setAuth) },
    removeChannel: jest.fn(async (c: FakeChannel) => {
      removed.push(c)
      return 'ok' as const
    }),
  }
  return { client: client as unknown as RealtimeAuthClient<FakeChannel>, removed, raw: client }
}

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

describe('subscribeBusinessRealtimeWithAuth (business copy)', () => {
  it('subscribes only after the token is set', async () => {
    let release!: () => void
    const { client } = fakeClient(() => new Promise<void>((r) => (release = r)))
    const build = jest.fn(() => ({ name: 'c1' }))

    subscribeWithAuth(client, build)
    await tick()
    expect(build).not.toHaveBeenCalled()

    release()
    await tick()
    expect(build).toHaveBeenCalledTimes(1)
  })

  it('never subscribes when cleaned up before the token arrives (Strict Mode remount)', async () => {
    let release!: () => void
    const { client, raw } = fakeClient(() => new Promise<void>((r) => (release = r)))
    const build = jest.fn(() => ({ name: 'c1' }))

    const cleanup = subscribeWithAuth(client, build)
    cleanup()
    release()
    await tick()

    expect(build).not.toHaveBeenCalled()
    expect(raw.removeChannel).not.toHaveBeenCalled()
  })

  it('removes the channel on cleanup after subscribing', async () => {
    const { client, removed } = fakeClient(async () => {})
    const cleanup = subscribeWithAuth(client, () => ({ name: 'c1' }))
    await tick()

    cleanup()

    expect(removed).toEqual([{ name: 'c1' }])
  })

  it('still subscribes when setting the token fails, so nothing is worse than before', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const { client } = fakeClient(async () => {
      throw new Error('no session')
    })
    const build = jest.fn(() => ({ name: 'c1' }))

    subscribeWithAuth(client, build)
    await tick()

    expect(build).toHaveBeenCalledTimes(1)
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('cleanup is safe to call twice', async () => {
    const { client, raw } = fakeClient(async () => {})
    const cleanup = subscribeWithAuth(client, () => ({ name: 'c1' }))
    await tick()

    cleanup()
    cleanup()

    expect(raw.removeChannel).toHaveBeenCalledTimes(1)
  })
})
