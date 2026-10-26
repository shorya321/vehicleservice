/**
 * Regression: Next 16 keeps a visited page alive and re-runs the hero's effect
 * on the same DOM when you come back. The old cleanup lost the canvas's WebGL
 * context, so the remount drew on a dead canvas, which Chrome paints white over
 * the map. Every mount must get a fresh canvas, and cleanup must remove it.
 */
import { mountTrafficCanvas } from '@/components/home/hero/traffic-mount'

interface FakeCanvas { className: string; removed: boolean; remove: () => void; attrs: Record<string, string>; setAttribute: (k: string, v: string) => void }

function fakeHost() {
  const children: FakeCanvas[] = []
  const created: FakeCanvas[] = []
  const host = {
    ownerDocument: {
      createElement: (tag: string) => {
        expect(tag).toBe('canvas')
        const canvas: FakeCanvas = {
          className: '',
          removed: false,
          attrs: {},
          setAttribute(k, v) { this.attrs[k] = v },
          remove() {
            this.removed = true
            children.splice(children.indexOf(this), 1)
          },
        }
        created.push(canvas)
        return canvas
      },
    },
    appendChild: (c: FakeCanvas) => { children.push(c); return c },
  }
  return { host: host as unknown as HTMLElement, children, created }
}

describe('mountTrafficCanvas', () => {
  it('appends a decorative canvas and starts the loop on it', () => {
    const { host, children } = fakeHost()
    const start = jest.fn(() => () => {})
    mountTrafficCanvas(host, start)
    expect(children).toHaveLength(1)
    expect(children[0].className).toBe('hero-traffic')
    expect(children[0].attrs['aria-hidden']).toBe('true')
    expect(start).toHaveBeenCalledWith(children[0])
  })

  it('stops the loop and removes the canvas on cleanup', () => {
    const { host, children, created } = fakeHost()
    const stop = jest.fn()
    const cleanup = mountTrafficCanvas(host, () => stop)
    cleanup()
    expect(stop).toHaveBeenCalledTimes(1)
    expect(created[0].removed).toBe(true)
    expect(children).toHaveLength(0)
  })

  it('uses a new canvas on every remount, never the old one', () => {
    const { host, children, created } = fakeHost()
    const started: unknown[] = []
    const start = (c: HTMLCanvasElement) => { started.push(c); return () => {} }
    mountTrafficCanvas(host, start)()
    mountTrafficCanvas(host, start)
    expect(created).toHaveLength(2)
    expect(started[0]).not.toBe(started[1])
    expect(children).toEqual([created[1]])
  })
})
