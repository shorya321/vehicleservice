import * as React from 'react'
import { RouteMap } from './route-map'

// `import * as React` is for jest: ts-jest compiles JSX with the classic
// runtime, which needs React in scope. Next itself uses the automatic runtime.

/**
 * Right-hand card of the "Your account" section: a saved route on the city
 * map, with the vehicle driving it. It illustrates a route kept in the
 * account, not live tracking, which customers do not have; keep the copy
 * that way. One labelled image for assistive tech.
 */
export function SavedRoute(): React.JSX.Element {
  return (
    <figure
      className="saved-route"
      role="img"
      aria-label="Sample saved route from DXB Terminal 3 to Palm Jumeirah"
    >
      <div className="saved-route__head" aria-hidden="true">
        <span className="editorial-list-meta">Saved route</span>
        <span className="saved-route__fixed">Fixed fare</span>
      </div>
      <RouteMap />
      <figcaption className="saved-route__foot" aria-hidden="true">
        <div>
          <b className="editorial-list-title">DXB Terminal 3 to Palm Jumeirah</b>
          <span className="saved-route__facts numeric">33 km · 35 min · Business class</span>
        </div>
        <span className="saved-route__rebook">Rebook</span>
      </figcaption>
    </figure>
  )
}
