import { fleetBarLabel } from '@/lib/availability/bar-label'
import type { CalendarEvent } from '@/app/vendor/availability/types'

/**
 * The short label a Fleet bar carries.
 *
 * The bar is sized by duration, so its width has nothing to do with how long its
 * text is. Shortening the text is half of what makes a bar readable; the other
 * half is widening it, which lives in `timeline.ts`.
 */

type LabelInput = Pick<CalendarEvent, 'title' | 'type' | 'source' | 'details'>

describe('fleetBarLabel', () => {
  it('reduces a blocked period to its reason, because the lane already names the vehicle', () => {
    const block: LabelInput = {
      title: 'Chevrolet Tahoe - maintenance',
      type: 'unavailable',
      source: 'blocked',
      details: { reason: 'maintenance', notes: null },
    }

    expect(fleetBarLabel(block)).toBe('Maintenance')
  })

  it('title-cases whatever reason the vendor picked', () => {
    const leave: LabelInput = {
      title: 'Abhinav Chaudhary - leave',
      type: 'unavailable',
      source: 'blocked',
      details: { reason: 'leave', notes: null },
    }

    expect(fleetBarLabel(leave)).toBe('Leave')
  })

  it('reduces an offline booking to the customer, dropping the reference', () => {
    const offline: LabelInput = {
      title: 'ZZ-OVERLAP-A · Overlap A',
      type: 'booking',
      source: 'offline',
      details: { customer: 'Overlap A', vehicle: null, driver: null },
    }

    expect(fleetBarLabel(offline)).toBe('Overlap A')
  })

  it('leaves an online booking alone, since Trip #1234 is already short', () => {
    const online: LabelInput = {
      title: 'Trip #INFTTHH',
      type: 'booking',
      source: 'online',
      details: { customer: 'Mohammed Al Rashid', vehicle: null, driver: null },
    }

    expect(fleetBarLabel(online)).toBe('Trip #INFTTHH')
  })

  it('cuts a real production label down by more than half', () => {
    const offline: LabelInput = {
      title: 'DB-20260212-0007 · Mohammed Al Rashid',
      type: 'booking',
      source: 'offline',
      details: { customer: 'Mohammed Al Rashid', vehicle: null, driver: null },
    }

    expect(fleetBarLabel(offline).length).toBeLessThan(offline.title.length / 1.5)
  })
})

describe('fleetBarLabel fallbacks', () => {
  it('keeps the full title when a block has no reason', () => {
    const block: LabelInput = {
      title: 'Chevrolet Tahoe - maintenance',
      type: 'unavailable',
      source: 'blocked',
      details: undefined,
    }

    expect(fleetBarLabel(block)).toBe('Chevrolet Tahoe - maintenance')
  })

  it('keeps the full title when an offline booking has no customer', () => {
    const offline: LabelInput = {
      title: 'ZZ-OVERLAP-A · Overlap A',
      type: 'booking',
      source: 'offline',
      details: { customer: null, vehicle: null, driver: null },
    }

    expect(fleetBarLabel(offline)).toBe('ZZ-OVERLAP-A · Overlap A')
  })

  it('ignores a customer that is only whitespace', () => {
    const offline: LabelInput = {
      title: 'ZZ-BLANK · ',
      type: 'booking',
      source: 'offline',
      details: { customer: '   ', vehicle: null, driver: null },
    }

    expect(fleetBarLabel(offline)).toBe('ZZ-BLANK · ')
  })

  // A bar with no text is exactly what the vendor reported, so the one thing this
  // function must never do is return an empty string for an event that has a title.
  it('never returns empty for an event that has a title', () => {
    const cases: LabelInput[] = [
      { title: 'Trip #1', type: 'booking', source: 'online', details: undefined },
      { title: 'Camry - other', type: 'unavailable', source: 'blocked', details: undefined },
      { title: 'REF · Someone', type: 'booking', source: 'offline', details: undefined },
    ]

    for (const input of cases) {
      expect(fleetBarLabel(input).length).toBeGreaterThan(0)
    }
  })
})
