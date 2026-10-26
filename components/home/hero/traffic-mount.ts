/**
 * Puts a fresh canvas in the host for each mount and removes it on cleanup.
 * Next 16 keeps a visited page alive and re-runs effects on the same DOM when
 * you come back, so a canvas rendered by React would be reused after its WebGL
 * context was lost, and Chrome paints a lost canvas white over the map.
 */
export function mountTrafficCanvas(
  host: HTMLElement,
  start: (canvas: HTMLCanvasElement) => () => void,
): () => void {
  const canvas = host.ownerDocument.createElement('canvas')
  canvas.className = 'hero-traffic'
  canvas.setAttribute('aria-hidden', 'true')
  host.appendChild(canvas)
  const stop = start(canvas)

  return () => {
    stop()
    canvas.remove()
  }
}
