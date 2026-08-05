-- Child seat descriptions: state ages alongside weights
-- Date: 2026-08-04
-- Description: The guest picker talks in AGES ("Adults 12+", "Children 2-11", "Infants under 2")
--              while the child-seat add-ons described themselves in WEIGHTS ("9-18kg"). A customer
--              reading both had to convert between the two to pick the right seat, and the cheapest
--              option (Booster, AED 8) is the easiest one to pick by mistake.
--
--              Stating both makes the correct seat obvious at the point of choice. The per-seat age
--              captured at checkout still backstops a wrong pick — this only reduces how often the
--              operator has to correct one.
--
--              WEIGHT REMAINS THE REAL DETERMINANT. The age spans are the standard ECE R44 group
--              equivalents and are deliberately hedged with "approx." — a large 3-year-old can be
--              out of a Group 1 seat early. Do not reword these into hard age limits.
--
--              Data-only: no schema change, and `description` is free text (nullable) already.
--              Rendered in the checkout add-on card, the business wizard card and the quotation
--              extras picker. NOT rendered on the quotation PDF or in any email — those use the
--              add-on name only — so there is no @react-pdf glyph risk from the middle dot.

UPDATE public.addons
   SET description = 'Up to 10kg · approx. under 1 year',
       updated_at = NOW()
 WHERE name = 'Infant Car Seat' AND category = 'Child Safety';

UPDATE public.addons
   SET description = '9-18kg · approx. 1-4 years',
       updated_at = NOW()
 WHERE name = 'Toddler Car Seat' AND category = 'Child Safety';

UPDATE public.addons
   SET description = '15-36kg · approx. 4-11 years',
       updated_at = NOW()
 WHERE name = 'Booster Seat' AND category = 'Child Safety';

-- Second booster for a party carrying two older children. Previously a loose sentence
-- ("Protects child from severe injuries during mishappening") that said nothing about fit.
UPDATE public.addons
   SET description = '15-36kg · approx. 4-11 years · second booster',
       updated_at = NOW()
 WHERE name = 'Extra Booster Seat' AND category = 'Child Safety';
