/**
 * Child seats can never outnumber the children + infants on a business booking.
 *
 * The Review step hides the whole child-seat group once that capacity reaches 0, so a selection
 * left over from a higher guest count becomes invisible while still being priced and still being
 * submitted. calculateBusinessBookingPrice then rejects the booking and the operator has no
 * control on screen to remove the seats. capChildSeats is what keeps the wizard's form data from
 * ever reaching that state.
 *
 * The same-reference guarantee is load-bearing, not a micro-optimisation: updateFormData runs this
 * on every single field change, and a fresh array each time would give the wizard a new
 * selected_addons identity on every keystroke.
 */

import { capChildSeats } from '@/lib/business/child-seat-capacity'

const seat = (over: Partial<ReturnType<typeof baseSeat>> = {}) => ({ ...baseSeat(), ...over })

function baseSeat() {
  return {
    addon_id: 'seat-a',
    quantity: 2,
    unit_price: 10,
    total_price: 20,
    child_ages: [3, 5] as (number | null)[],
    requires_child_age: true,
  }
}

/** A Comfort/Luggage add-on: no age, never touched by the cap. */
const wifi = {
  addon_id: 'wifi',
  quantity: 1,
  unit_price: 15,
  total_price: 15,
}

describe('capChildSeats', () => {
  it('returns the same array reference when the seats already fit', () => {
    const addons = [seat()]
    expect(capChildSeats(addons, 2)).toBe(addons)
  })

  it('returns the same array reference when there is spare capacity', () => {
    const addons = [seat()]
    expect(capChildSeats(addons, 5)).toBe(addons)
  })

  it('is a no-op on an empty selection', () => {
    const addons: never[] = []
    expect(capChildSeats(addons, 0)).toBe(addons)
  })

  it('drops every seat at capacity 0', () => {
    expect(capChildSeats([seat()], 0)).toEqual([])
  })

  it('shrinks a seat to the remaining capacity, rebuilding total and ages', () => {
    const [only] = capChildSeats([seat({ quantity: 3, total_price: 30, child_ages: [1, 2, 3] })], 2)
    expect(only.quantity).toBe(2)
    expect(only.total_price).toBe(20)
    expect(only.child_ages).toEqual([1, 2])
  })

  it('pads child_ages with null when a shrink cannot reuse existing entries', () => {
    const [only] = capChildSeats([seat({ quantity: 3, total_price: 30, child_ages: [] })], 2)
    expect(only.child_ages).toEqual([null, null])
  })

  it('spends the budget in order, keeping the first seat whole', () => {
    const first = seat({ addon_id: 'infant', quantity: 2, child_ages: [0, 1] })
    const second = seat({ addon_id: 'booster', quantity: 2, unit_price: 8, total_price: 16, child_ages: [6, 7] })
    const result = capChildSeats([first, second], 3)
    expect(result).toHaveLength(2)
    expect(result[0]).toBe(first)
    expect(result[1].quantity).toBe(1)
    expect(result[1].total_price).toBe(8)
    expect(result[1].child_ages).toEqual([6])
  })

  it('drops a seat entirely once the budget is exhausted, keeping earlier ones', () => {
    const first = seat({ addon_id: 'infant', quantity: 2 })
    const second = seat({ addon_id: 'booster', quantity: 1, total_price: 10, child_ages: [6] })
    const result = capChildSeats([first, second], 2)
    expect(result).toEqual([first])
  })

  it('never touches non-seat addons and preserves their position', () => {
    const result = capChildSeats([wifi, seat({ quantity: 2 }), wifi], 0)
    expect(result).toEqual([wifi, wifi])
  })

  it('leaves non-seat addons alone even when capacity is 0 and nothing else changes', () => {
    const addons = [wifi]
    expect(capChildSeats(addons, 0)).toBe(addons)
  })

  it('treats a negative capacity as zero rather than going out of bounds', () => {
    expect(capChildSeats([seat()], -1)).toEqual([])
  })

  it('does not mutate the input', () => {
    const addons = [seat({ quantity: 3, total_price: 30, child_ages: [1, 2, 3] })]
    capChildSeats(addons, 1)
    expect(addons[0].quantity).toBe(3)
    expect(addons[0].total_price).toBe(30)
    expect(addons[0].child_ages).toEqual([1, 2, 3])
  })
})
