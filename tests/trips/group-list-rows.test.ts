import { groupTripRows } from '@/lib/trips/group-list-rows'

interface Row {
  id: string
  booking_group_id?: string | null
  leg_index?: number | null
}

const row = (id: string, group: string | null = null, leg: number | null = null): Row => ({
  id,
  booking_group_id: group,
  leg_index: leg,
})

describe('groupTripRows', () => {
  it('passes one-way and business rows through unchanged', () => {
    const rows = [row('a'), row('b')]
    const out = groupTripRows(rows)
    expect(out).toEqual(rows)
    expect(out[0]).toBe(rows[0])
    expect(out[0].trip_legs).toBeUndefined()
  })

  it('collapses a round trip into one row led by the outbound', () => {
    const out = groupTripRows([row('ret', 'g1', 1), row('out', 'g1', 0)])
    expect(out).toHaveLength(1)
    expect(out[0].id).toBe('out')
    expect(out[0].trip_legs?.map((leg) => leg.id)).toEqual(['out', 'ret'])
  })

  it('collapses a multi-city trip and keeps it where its first journey sat', () => {
    const out = groupTripRows([
      row('x'),
      row('m0', 'g2', 0),
      row('m1', 'g2', 1),
      row('y'),
      row('m2', 'g2', 2),
    ])
    expect(out.map((r) => r.id)).toEqual(['x', 'm0', 'y'])
    expect(out[1].trip_legs?.map((leg) => leg.id)).toEqual(['m0', 'm1', 'm2'])
  })

  it('keeps separate trips apart', () => {
    const out = groupTripRows([row('a0', 'ga', 0), row('b0', 'gb', 0), row('a1', 'ga', 1), row('b1', 'gb', 1)])
    expect(out.map((r) => [r.id, r.trip_legs?.length])).toEqual([['a0', 2], ['b0', 2]])
  })

  it('leads with the earliest matched journey when a filter hid the others', () => {
    const out = groupTripRows([row('m2', 'g', 2), row('m1', 'g', 1)])
    expect(out).toHaveLength(1)
    expect(out[0].id).toBe('m1')
    expect(out[0].trip_legs?.map((leg) => leg.id)).toEqual(['m1', 'm2'])
  })

  it('does not mutate the input rows', () => {
    const rows = [row('out', 'g', 0), row('ret', 'g', 1)]
    const snapshot = JSON.parse(JSON.stringify(rows))
    const out = groupTripRows(rows)
    expect(rows).toEqual(snapshot)
    expect(out[0]).not.toBe(rows[0])
  })
})
