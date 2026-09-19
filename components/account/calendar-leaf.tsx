/**
 * A small desk-calendar leaf showing a date: month on a gold strip, day beneath.
 *
 * The third of the site's three numeral devices, drawn in the same gold hairline and halo as the
 * other two: the ring marks a step (.promise-card__index) and the clock marks a time
 * (app/booking/confirmation/components/day-time.tsx), so a day gets a calendar.
 *
 * Takes the parts already formatted in the operating timezone rather than a Date, so it never
 * resolves a day boundary in the browser's own zone. Decorative: the date it shows is always
 * stated in text beside it, so it is hidden from assistive technology.
 */

interface CalendarLeafProps {
  /** Short month, e.g. "Sept". Upper-cased by CSS. */
  month: string
  /** Day of the month, e.g. "26". */
  day: string
}

export function CalendarLeaf({ month, day }: CalendarLeafProps): React.JSX.Element {
  return (
    <span className="account-leaf" aria-hidden="true">
      <span className="account-leaf__month">{month}</span>
      <span className="account-leaf__day">{day}</span>
    </span>
  )
}
