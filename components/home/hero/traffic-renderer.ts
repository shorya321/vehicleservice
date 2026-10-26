import {
  MAP_VIEW_Y,
  TRAFFIC_FRAGMENT,
  TRAFFIC_MAX_DPR,
  TRAFFIC_SPEED,
  TRAFFIC_STILL_TIME,
  TRAFFIC_VERTEX,
  mapViewTransform,
  parseTrafficStyle,
} from './traffic-shader'

type Uniforms = Record<'uRes' | 'uOff' | 'uScale' | 'uViewY' | 'uTime' | 'uStrength' | 'uCol', WebGLUniformLocation | null>

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader
  console.warn('[hero-traffic] shader compile failed:', gl.getShaderInfoLog(shader))
  gl.deleteShader(shader)
  return null
}

function createProgram(gl: WebGLRenderingContext): { program: WebGLProgram; uniforms: Uniforms } | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, TRAFFIC_VERTEX)
  const fragment = compile(gl, gl.FRAGMENT_SHADER, TRAFFIC_FRAGMENT)
  const program = gl.createProgram()
  if (!vertex || !fragment || !program) return null
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('[hero-traffic] program link failed:', gl.getProgramInfoLog(program))
    return null
  }
  gl.useProgram(program)

  /* One triangle that covers the viewport. */
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const position = gl.getAttribLocation(program, 'p')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

  const names = ['uRes', 'uOff', 'uScale', 'uViewY', 'uTime', 'uStrength', 'uCol'] as const
  const uniforms = Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(program, n)])) as Uniforms
  return { program, uniforms }
}

/**
 * Starts the traffic loop on a canvas and returns its cleanup. Without WebGL,
 * or if the shader fails, the canvas stays transparent and the map shows as it
 * always has. Reduced motion draws one still frame. The loop sleeps while the
 * hero is off screen or the tab is hidden.
 */
export function startTraffic(canvas: HTMLCanvasElement): () => void {
  /* A canvas whose context is gone paints white in Chrome, so it is hidden
     whenever the shader cannot draw. The map underneath shows as before. */
  const hide = (): void => {
    canvas.style.visibility = 'hidden'
  }
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false })
  if (!gl || gl.isContextLost()) {
    hide()
    return () => {}
  }
  const setup = createProgram(gl)
  if (!setup) {
    hide()
    return () => {}
  }
  const { uniforms: u } = setup

  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
  let time = TRAFFIC_STILL_TIME
  let last = 0
  let frame = 0
  let onScreen = true
  let lost = false
  let strength = 0

  const readStyle = (): void => {
    const css = getComputedStyle(canvas)
    const style = parseTrafficStyle(
      css.getPropertyValue('--hero-traffic-rgb'),
      css.getPropertyValue('--hero-traffic-strength'),
    )
    strength = style?.strength ?? 0
    gl.uniform3fv(u.uCol, style?.color ?? [0, 0, 0])
    gl.uniform1f(u.uStrength, strength)
  }

  const resize = (): void => {
    const dpr = Math.min(window.devicePixelRatio || 1, TRAFFIC_MAX_DPR)
    const width = Math.max(1, Math.round(canvas.clientWidth * dpr))
    const height = Math.max(1, Math.round(canvas.clientHeight * dpr))
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }
    const view = mapViewTransform(width, height)
    gl.viewport(0, 0, width, height)
    gl.uniform2f(u.uRes, width, height)
    gl.uniform2f(u.uOff, view.offsetX, view.offsetY)
    gl.uniform1f(u.uScale, view.scale)
    gl.uniform1f(u.uViewY, MAP_VIEW_Y)
  }

  const draw = (): void => {
    if (lost) return
    gl.uniform1f(u.uTime, time)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    if (strength > 0) gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  const tick = (now: number): void => {
    frame = 0
    time += last ? Math.min((now - last) / 1000, 0.1) * TRAFFIC_SPEED : 0
    last = now
    draw()
    schedule()
  }

  function schedule(): void {
    const running = !lost && onScreen && !document.hidden && !reducedQuery.matches && strength > 0
    if (!running) {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
      last = 0
      return
    }
    if (!frame) frame = requestAnimationFrame(tick)
  }

  const refresh = (): void => {
    readStyle()
    draw()
    schedule()
  }

  const resizeObserver = new ResizeObserver(() => {
    resize()
    draw()
  })
  const viewObserver = new IntersectionObserver(([entry]) => {
    onScreen = entry?.isIntersecting ?? true
    schedule()
  })
  /* next-themes flips the `dark` / `light` class on <html>. */
  const themeObserver = new MutationObserver(refresh)
  const onLost = (event: Event): void => {
    event.preventDefault()
    lost = true
    hide()
    schedule()
  }

  resize()
  readStyle()
  resizeObserver.observe(canvas)
  viewObserver.observe(canvas)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  darkQuery.addEventListener('change', refresh)
  reducedQuery.addEventListener('change', refresh)
  document.addEventListener('visibilitychange', schedule)
  canvas.addEventListener('webglcontextlost', onLost)
  draw()
  schedule()

  return () => {
    if (frame) cancelAnimationFrame(frame)
    resizeObserver.disconnect()
    viewObserver.disconnect()
    themeObserver.disconnect()
    darkQuery.removeEventListener('change', refresh)
    reducedQuery.removeEventListener('change', refresh)
    document.removeEventListener('visibilitychange', schedule)
    canvas.removeEventListener('webglcontextlost', onLost)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
}
