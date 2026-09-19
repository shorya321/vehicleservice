/**
 * One moment in the confirmation's "On the day" list: a small clock face with
 * its hands set to the time, then the time itself.
 *
 * The ring is the same 40px gold ring the step indices use across the site
 * (.promise-card__index); here it earns hands because the content is a time.
 *
 * `value` is the already-formatted "HH:MM" string, so the hands read the
 * operating timezone the caller formatted in rather than re-deriving it from
 * a Date here. Anything else (the "01" / "02" fallback rows shown when the
 * pickup time is unknown) gets the ring with the label inside and no hands.
 */

const HH_MM = /^(\d{1,2}):(\d{2})$/

// Quarter-hour ticks: 12, 3, 6 and 9.
const TICK_ANGLES = [0, 90, 180, 270] as const

interface DayTimeProps {
  value: string
}

export function DayTime({ value }: DayTimeProps): React.JSX.Element {
  const match = HH_MM.exec(value)

  if (!match) {
    return (
      <span className="confirm-sat__time">
        <span className="confirm-sat__ring" aria-hidden="true">{value}</span>
        <span className="sr-only">Step {value}</span>
      </span>
    )
  }

  const hours = Number(match[1])
  const minutes = Number(match[2])
  const hourAngle = ((hours % 12) + minutes / 60) * 30
  const minuteAngle = minutes * 6

  return (
    <span className="confirm-sat__time">
      <svg className="confirm-sat__clock" viewBox="0 0 40 40" aria-hidden="true">
        <circle className="confirm-sat__clock-halo" cx="20" cy="20" r="21.5" />
        <circle className="confirm-sat__clock-face" cx="20" cy="20" r="19.5" />
        {TICK_ANGLES.map((angle) => (
          <line
            key={angle}
            className="confirm-sat__clock-tick"
            x1="20"
            y1="4.5"
            x2="20"
            y2="7"
            transform={`rotate(${angle} 20 20)`}
          />
        ))}
        <line
          className="confirm-sat__clock-hand"
          x1="20"
          y1="20"
          x2="20"
          y2="11.5"
          strokeWidth="1.6"
          transform={`rotate(${hourAngle} 20 20)`}
        />
        <line
          className="confirm-sat__clock-hand"
          x1="20"
          y1="20"
          x2="20"
          y2="7.5"
          strokeWidth="1"
          transform={`rotate(${minuteAngle} 20 20)`}
        />
        <circle className="confirm-sat__clock-pin" cx="20" cy="20" r="1.6" />
      </svg>
      <span className="confirm-sat__time-value">{value}</span>
    </span>
  )
}
