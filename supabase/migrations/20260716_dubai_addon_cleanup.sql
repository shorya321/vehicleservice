-- Add-on cleanup for the Dubai vehicle-transfer launch
-- Date: 2026-07-16
-- Description: The `addons` table carried seed data from a generic/European transfer template.
--              The booking Review step rendered 12 selectable add-ons, several of which cannot
--              earn money or make sense in the UAE, burying the one add-on that is both legally
--              required and revenue-earning: the child seat. This trims 12 -> 8.
--
--              Judged by Dubai relevance, NOT usage count. The DB holds only 3 bookings, so usage
--              proves nothing: Toddler Car Seat and Booster Seat have 0 uses purely because the
--              product has not launched. They are legally required (UAE: child safety seat
--              mandatory under age 4; restraints and rear seating to age 10 / 145cm) and are KEPT.
--
--              Removed:
--                Ski/Snowboard Equipment - Dubai is a desert; Ski Dubai rents equipment on-site.
--                                          Pure template leftover.
--                Premium Water           - AED 0. Every Dubai operator includes water free.
--                Phone Chargers          - AED 0. Expected amenity, not a sellable add-on.
--                Newspapers/Magazines    - AED 0. Amenity, and an obsolete category.
--
--              An AED 0 "add-on" is a contradiction: it adds friction to every booking, earns
--              nothing, and competes for attention with the child seat. These belong in a
--              "What's included" list on the vehicle, not as selectable rows.
--
--              Kept (8): Infant/Toddler/Booster Car Seat, Extra Luggage, Golf Clubs (Dubai golf
--              tourism is real), Pet Transport, In-Car WiFi, Refreshments.
--
--              Data-only. No schema change, no application code. Add-ons are fetched generically
--              by is_active/category, so nothing references these rows by name.

-- 1. Deactivate AED 0 amenities that existing bookings reference.
--    business_booking_addons.addon_id and booking_amenities.addon_id are ON DELETE RESTRICT, so a
--    DELETE here would be refused by the database. is_active = false hides them from the booking UI
--    (getActiveAddons + calculateBusinessBookingPrice both filter on is_active) while past
--    bookings, emails and invoices keep rendering correctly.

UPDATE addons
   SET is_active = false
 WHERE name IN ('Phone Chargers', 'Newspapers/Magazines');

-- 2. Hard-delete unreferenced, Dubai-irrelevant add-ons.
--    The NOT EXISTS guards keep this safe and reproducible on any environment: where a row IS
--    referenced, it is skipped rather than aborting the migration on the RESTRICT constraint.

DELETE FROM addons a
 WHERE a.name IN ('Ski/Snowboard Equipment', 'Premium Water')
   AND NOT EXISTS (SELECT 1 FROM business_booking_addons b WHERE b.addon_id = a.id)
   AND NOT EXISTS (SELECT 1 FROM booking_amenities  m WHERE m.addon_id = a.id);
