"use client"
import { CreditCard, PlaneLanding, Smartphone, type LucideIcon } from "lucide-react"

import type { HomeContent } from "@/lib/cms/templates/home/schema"
import { usePromiseRouteCar } from "./use-promise-route-car"

type PromiseItem = HomeContent['benefits']['items'][number]

interface PromiseRouteProps {
  items: PromiseItem[]
}

/* One road, two drawings: across the section on desktop, down the left edge
   on phones. CSS shows one; the hook drives the car along whichever is
   visible. vector-effect keeps the stroke width fixed while the viewBox
   stretches with preserveAspectRatio="none". */
const ROAD_H = "M 40 70 C 260 70, 300 30, 620 40 S 980 100, 1200 60"
const ROAD_V = "M 22 20 C 22 300, 22 400, 22 980"

/* By position, matching the stops of a transfer: booked on your phone, met
   as you land, paid by card. The schema fixes the list at three items. */
const STOP_ICONS: LucideIcon[] = [Smartphone, PlaneLanding, CreditCard]

/**
 * The home promises as the stops of a transfer: book, met at arrivals,
 * dropped off with nothing to pay. A car drives between the stops and the
 * card it reaches lights up; choosing a card sends the car there and stops
 * the tour.
 */
export function PromiseRoute({ items }: PromiseRouteProps) {
  const { wrapRef, carRef, markRefs, roadHRef, roadVRef, active, choose } =
    usePromiseRouteCar(items.length)

  return (
    <div ref={wrapRef} className="promise-route">
      <svg className="promise-route__road promise-route__road--h" viewBox="0 0 1240 120" preserveAspectRatio="none" aria-hidden="true">
        <path ref={roadHRef} className="promise-route__tarmac" d={ROAD_H} />
        <path className="promise-route__lane" d={ROAD_H} />
      </svg>
      <svg className="promise-route__road promise-route__road--v" viewBox="0 0 44 1000" preserveAspectRatio="none" aria-hidden="true">
        <path ref={roadVRef} className="promise-route__tarmac" d={ROAD_V} />
        <path className="promise-route__lane" d={ROAD_V} />
      </svg>

      {items.map((_, index) => (
        <i
          key={index}
          ref={(node) => { markRefs.current[index] = node }}
          className={`promise-route__stop${index === active ? ' is-active' : ''}`}
          aria-hidden="true"
        />
      ))}

      <svg ref={carRef} className="promise-route__car" viewBox="0 0 46 24" aria-hidden="true">
        <rect className="promise-route__car-body" x="1" y="2" width="44" height="20" rx="9" />
        <rect className="promise-route__car-glass" x="11" y="4.5" width="9" height="15" rx="3" />
        <rect className="promise-route__car-glass" x="27" y="4.5" width="10" height="15" rx="3" opacity="0.8" />
        <rect className="promise-route__car-lamp" x="40" y="4" width="4" height="4" rx="1.5" />
        <rect className="promise-route__car-lamp" x="40" y="16" width="4" height="4" rx="1.5" />
      </svg>

      <ol className="promise-route__cards">
        {items.map((item, index) => {
          const Icon = STOP_ICONS[index] ?? Smartphone
          return (
          <li key={index}>
            <button
              type="button"
              className="promise-route__card"
              aria-pressed={index === active}
              onClick={() => choose(index)}
            >
              <span className="promise-route__icon" aria-hidden="true">
                <Icon size={18} strokeWidth={1.6} />
              </span>
              <h3 className="editorial-list-title">{item.title}</h3>
              <p className="editorial-list-body">{item.body}</p>
              {item.meta && <span className="promise-route__foot editorial-list-meta">{item.meta}</span>}
            </button>
          </li>
          )
        })}
      </ol>
    </div>
  )
}
