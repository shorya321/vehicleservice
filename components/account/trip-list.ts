/**
 * How the Trips list files a row under "Upcoming" or "Travelled".
 *
 * Split by the clock, not by booking_status: that column only reaches "completed" when a vendor
 * closes the job, which often never happens. A round trip or multi-city order arrives as one row
 * carrying its journeys in `trip_legs`, and stays upcoming while any journey that is still going
 * ahead has not happened yet: an outbound taken last week does not make Saturday's return history.
 */
interface ClockRow {
  pickup_datetime: string
  booking_status: string
  trip_legs?: ClockRow[]
}

function journeyAhead(row: ClockRow, now: number): boolean {
  return row.booking_status !== "cancelled" && new Date(row.pickup_datetime).getTime() >= now
}

export function isStillAhead(row: ClockRow, now: number): boolean {
  const journeys = row.trip_legs?.length ? row.trip_legs : [row]
  return journeys.some((journey) => journeyAhead(journey, now))
}
