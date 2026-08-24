/**
 * The floor on a business trip's child seats: one restraint per child and infant.
 *
 * Everything else in the module is a ceiling. `capChildSeats` trims seats down to
 * children + infants, both pickers stop the increment at that number, and
 * `calculateBusinessBookingPrice` rejects anything above it. Nothing required
 * reaching it, so a trip could declare two infants, select no seat at all, and be
 * booked with no message shown. That is what this closes.
 *
 * Kept in one place rather than copied into each surface. The duplication rule that
 * governs `child-seat-capacity.ts` and the quotation picker exists because those two
 * differ in substance (one rounds to satisfy the bqia_total CHECK, the other resolves
 * "is a seat" from the catalogue instead of a local flag). Neither reason applies to
 * counting, and a copied message would drift between the two buttons that show it.
 */

/**
 * Seats still owed before the trip may be saved or booked. 0 once the requirement is
 * met, and 0 whenever there are no children or infants to restrain.
 *
 * Over-selection returns 0 too. That case is not this function's to report: both
 * pickers already refuse the increment, and the server has its own message for it.
 */
export function childSeatShortfall(seatsSelected: number, capacity: number): number {
  return Math.max(0, capacity - Math.max(0, seatsSelected));
}

/** Plural-aware "seat" / "seats". */
function seatWord(n: number): string {
  return n === 1 ? 'seat' : 'seats';
}

/**
 * The single message both business surfaces render. Callers should only reach this
 * with a shortfall above 0.
 *
 * Two phrasings, because "select 2 more" reads as nonsense when none were picked yet.
 */
export function childSeatShortfallMessage(shortfall: number, capacity: number): string {
  if (shortfall <= 0) return '';

  const guests = `${capacity} ${capacity === 1 ? 'child or infant' : 'children and infants'}`;

  if (shortfall >= capacity) {
    return `Select ${capacity} child ${seatWord(capacity)}. This trip carries ${guests}, and each one needs their own seat.`;
  }

  return `Select ${shortfall} more child ${seatWord(shortfall)}. This trip carries ${guests}, and each one needs their own seat.`;
}

/**
 * The shape this needs, declared structurally for the same reason `child-seat-capacity.ts` does
 * it: nothing in lib should depend on a component's types, and the quotation editor's `DraftAddon`
 * satisfies this without being imported.
 */
interface CountableAddon {
  quantity: number;
  child_ages?: (number | null)[] | null;
  requires_child_age?: boolean;
}

/**
 * Seats on a quotation trip draft, recognising a seat exactly the way `addonsReadyToSave` does.
 *
 * The two-part test is not redundant. `requires_child_age` is deliberately never persisted, so a
 * trip reloaded for editing arrives without the flag and is identified by its non-null
 * `child_ages` instead. Counting on the flag alone would read 0 after a reload and let the sheet
 * save a trip whose children have no seats, which is the bug this whole rule exists to stop.
 */
export function draftSeatCount(addons: readonly CountableAddon[]): number {
  return addons.reduce(
    (n, a) => n + (a.requires_child_age || a.child_ages != null ? a.quantity : 0),
    0
  );
}
