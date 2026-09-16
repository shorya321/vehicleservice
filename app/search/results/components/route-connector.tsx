import * as React from 'react'

// `import * as React` is for jest: ts-jest compiles JSX with the classic
// runtime, which needs React in scope. Next itself uses the automatic runtime.

/**
 * The connector between the two place names in the search page's route
 * heading, in place of the arrow that used to sit there.
 *
 * It replaces the trip that used to be drawn on the band's map. That version
 * had to share a viewBox with the city or its pins stopped sitting on the real
 * Palm, and a phone-width slice shows roughly 540 of the window's 1428 units
 * against a 600-unit trip, so both pins were always cropped away. This is part
 * of the heading: it scales with the type and wraps with it, whole.
 *
 * Built from elements rather than one scaled SVG on purpose. The heading
 * stretches it to fill whatever space the two names leave, and a single SVG
 * scaled to that width would blow the dots and the car up with it. Here only
 * the track stretches; every other part is sized in `em` and holds its
 * proportions at any width.
 *
 * The road ahead is dotted and the trail behind the vehicle is solid, and the
 * two endpoints are a hollow ring at pickup and a haloed gold dot at drop-off:
 * all four match the saved-route card on the home page (`.saved-route__ahead`,
 * `__trail`, `__pin` and `__pin--end`). Trail and vehicle run off one shared
 * timing so the fill always ends under the car.
 *
 * Decorative, and honest about it: it encodes no geography and draws the same
 * shape on every route, which is why the map no longer draws one too.
 */
export function RouteConnector(): React.JSX.Element {
  return (
    <span className="route-connector" aria-hidden="true">
      <span className="route-connector__start" />

      <span className="route-connector__track">
        <span className="route-connector__trail" />
        <span className="route-connector__vehicle">
          <Vehicle />
        </span>
      </span>

      <span className="route-connector__end" />
    </span>
  )
}

/** Top-down car, nose to the right, the direction of travel. */
function Vehicle(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 10" focusable="false" aria-hidden="true">
      <rect x="0" y="0" width="24" height="10" rx="3.4" className="route-connector__car-body" />
      <rect x="13" y="1.6" width="6" height="6.8" rx="1.6" className="route-connector__car-glass" />
      <rect x="4.6" y="1.6" width="5" height="6.8" rx="1.6" className="route-connector__car-glass" />
    </svg>
  )
}
