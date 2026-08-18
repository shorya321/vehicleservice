/**
 * Keeps a business booking's child seats within the guests that can sit in them.
 *
 * Every child and infant occupies a seat and each needs its own restraint, so the number of child
 * seats can never exceed children + infants. Guests are chosen on the wizard's Route step and the
 * seats on its Review step, which means guests can be lowered *after* the seats were picked.
 *
 * Left uncorrected that is a dead end rather than a cosmetic drift: AddonSelection hides the whole
 * child-seat group once the capacity reaches 0, so the stale seats stay in `selected_addons`
 * priced and invisible, `childAgesComplete` still passes because their ages were filled in, and
 * the booking is only rejected at POST by calculateBusinessBookingPrice — with no control left on
 * screen to remove them.
 *
 * The trim semantics mirror the quotation editor's addon-picker, which already does this for
 * quotation trips. That copy is deliberately left where it is: it rounds totals to satisfy the
 * bqia_total CHECK and resolves "is a seat" from the catalogue rather than the local flag.
 * Duplication between business surfaces is the module's rule, not an oversight.
 */

/**
 * The shape this needs, declared structurally so nothing here depends on a component's types.
 * `SelectedAddon` (booking wizard) satisfies it without being imported.
 */
interface CappableAddon {
  quantity: number;
  unit_price: number;
  total_price: number;
  child_ages?: (number | null)[];
  requires_child_age?: boolean;
}

/** Grow with `null`s / truncate so the ages array always has exactly `quantity` entries. */
function resizeAges(existing: (number | null)[] | undefined, quantity: number): (number | null)[] {
  const next = (existing ?? []).slice(0, quantity);
  while (next.length < quantity) next.push(null);
  return next;
}

/**
 * Drop or shrink child seats until they fit `capacity` (children + infants), in selection order,
 * so the seats chosen first survive. Non-seat add-ons pass through untouched, keeping position.
 *
 * Returns the SAME array reference when nothing needs changing. That is load-bearing: the wizard
 * runs this on every form update, and handing back a fresh array each time would give
 * `selected_addons` a new identity on every keystroke.
 */
export function capChildSeats<T extends CappableAddon>(addons: T[], capacity: number): T[] {
  let budget = Math.max(0, capacity);
  let changed = false;
  const next: T[] = [];

  for (const addon of addons) {
    if (!addon.requires_child_age) {
      next.push(addon);
      continue;
    }

    const quantity = Math.min(addon.quantity, budget);
    budget -= quantity;

    if (quantity === addon.quantity) {
      next.push(addon);
      continue;
    }

    changed = true;
    if (quantity <= 0) continue;

    next.push({
      ...addon,
      quantity,
      total_price: addon.unit_price * quantity,
      child_ages: resizeAges(addon.child_ages, quantity),
    });
  }

  return changed ? next : addons;
}
