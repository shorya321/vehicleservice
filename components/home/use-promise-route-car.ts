"use client"
import * as React from "react"

/** Share of the road travelled per second. */
const SPEED = 0.22
/** How long the car waits at a stop before driving on. */
const DWELL_MS = 2600
const ARRIVED = 0.0005

interface PromiseRouteCar {
  wrapRef: React.RefObject<HTMLDivElement | null>
  carRef: React.RefObject<SVGSVGElement | null>
  markRefs: React.RefObject<Array<HTMLElement | null>>
  roadHRef: React.RefObject<SVGPathElement | null>
  roadVRef: React.RefObject<SVGPathElement | null>
  active: number
  choose: (index: number) => void
}

interface Point { x: number; y: number }

function stopAt(index: number, count: number): number {
  return count <= 1 ? 0 : index / (count - 1)
}

/** The road that is actually drawn: the other one is display: none and has no box. */
function visibleRoad(h: SVGPathElement | null, v: SVGPathElement | null): SVGPathElement | null {
  for (const path of [h, v]) {
    if (path?.ownerSVGElement && path.ownerSVGElement.getBoundingClientRect().width > 0) return path
  }
  return null
}

/** A point on the road, in px relative to the wrapper. */
function pointOnRoad(path: SVGPathElement, wrap: HTMLElement, t: number): Point | null {
  const svg = path.ownerSVGElement
  const matrix = svg?.getScreenCTM()
  if (!svg || !matrix) return null
  const at = path.getPointAtLength(Math.min(1, Math.max(0, t)) * path.getTotalLength())
  const screen = new DOMPoint(at.x, at.y).matrixTransform(matrix)
  const box = wrap.getBoundingClientRect()
  return { x: screen.x - box.left, y: screen.y - box.top }
}

/**
 * Drives the car between the stops. Position lives in refs and is written
 * straight to the DOM every frame; React state only changes when the car
 * reaches a stop, so the cards re-render three times per tour, not 60 times
 * a second. The tour stops for good once someone picks a card, sleeps while
 * the section is off screen, and never runs under reduced motion.
 */
export function usePromiseRouteCar(count: number): PromiseRouteCar {
  const wrapRef = React.useRef<HTMLDivElement | null>(null)
  const carRef = React.useRef<SVGSVGElement | null>(null)
  const markRefs = React.useRef<Array<HTMLElement | null>>([])
  const roadHRef = React.useRef<SVGPathElement | null>(null)
  const roadVRef = React.useRef<SVGPathElement | null>(null)
  const [active, setActive] = React.useState(0)

  const goalRef = React.useRef({ index: 0, picked: false, snap: false })

  const choose = React.useCallback((index: number) => {
    goalRef.current = { index, picked: true, snap: goalRef.current.snap }
    setActive(index)
  }, [])

  React.useEffect(() => {
    const wrap = wrapRef.current
    const car = carRef.current
    if (!wrap || !car) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    goalRef.current = { ...goalRef.current, snap: reduce }

    let pos = 0
    let holdUntil = performance.now() + 2000
    let visible = true
    let last = performance.now()
    let frame = 0

    const draw = (): void => {
      const road = visibleRoad(roadHRef.current, roadVRef.current)
      if (!road) return
      markRefs.current.forEach((mark, index) => {
        const p = mark && pointOnRoad(road, wrap, stopAt(index, count))
        if (mark && p) mark.style.transform = `translate(${p.x}px, ${p.y}px)`
      })
      const here = pointOnRoad(road, wrap, pos)
      const ahead = pointOnRoad(road, wrap, pos + 0.002)
      if (!here || !ahead) return
      const angle = (Math.atan2(ahead.y - here.y, ahead.x - here.x) * 180) / Math.PI
      car.style.transform = `translate(${here.x}px, ${here.y}px) rotate(${angle}deg)`
      car.classList.add('is-placed')
    }

    const tick = (now: number): void => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const goal = goalRef.current
      const target = stopAt(goal.index, count)
      const gap = target - pos

      if (goal.snap) {
        pos = target
      } else if (Math.abs(gap) > ARRIVED) {
        pos += Math.sign(gap) * Math.min(Math.abs(gap), dt * SPEED)
        if (Math.abs(target - pos) <= ARRIVED) {
          holdUntil = now + DWELL_MS
          if (!goal.picked) setActive(goal.index)
        }
      } else if (!goal.picked && now > holdUntil) {
        const next = goal.index + 1 >= count ? 0 : goal.index + 1
        if (next === 0) {
          pos = 0
          setActive(0)
          holdUntil = now + DWELL_MS
        }
        goalRef.current = { ...goal, index: next }
      }

      if (visible && !document.hidden) draw()
      frame = requestAnimationFrame(tick)
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true
    })
    observer.observe(wrap)

    const onResize = (): void => draw()
    window.addEventListener('resize', onResize)
    draw()
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [count])

  return { wrapRef, carRef, markRefs, roadHRef, roadVRef, active, choose }
}
