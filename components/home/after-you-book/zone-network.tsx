import * as React from 'react'
import { HUB, ZONES, arcPath, project } from './zone-geometry'

// `import * as React` is for jest: ts-jest compiles JSX with the classic
// runtime, which needs React in scope. Next itself uses the automatic runtime.

/**
 * Decorative map for the "After you book" plate. Arcs are one stretched SVG;
 * nodes and labels are HTML placed by percentage so their text never scales.
 * Colours come from the theme tokens, see `.after-book-net` in app/globals.css.
 */
export function ZoneNetwork(): React.JSX.Element {
  const hub = project(HUB)

  return (
    <div className="after-book-net" aria-hidden="true">
      <svg
        className="after-book-net__arcs"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        focusable="false"
      >
        {ZONES.map((zone) => (
          <path key={zone.name} d={arcPath(zone)} className="after-book-net__arc" />
        ))}
      </svg>

      {ZONES.map((zone) => {
        const p = project(zone)
        const classes = [
          'after-book-net__node',
          zone.side === 'l' ? 'after-book-net__node--left' : '',
          zone.compact ? '' : 'after-book-net__node--minor',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <span
            key={zone.name}
            className={classes}
            style={
              {
                left: `${p.x}%`,
                top: `${p.y}%`,
                '--label-dy': `${zone.dy}px`,
              } as React.CSSProperties
            }
          >
            <span className="after-book-net__label">{zone.name}</span>
          </span>
        )
      })}

      <span
        className="after-book-net__node after-book-net__node--hub"
        style={{ left: `${hub.x}%`, top: `${hub.y}%` }}
      >
        <span className="after-book-net__label">{HUB.name}</span>
      </span>
    </div>
  )
}
