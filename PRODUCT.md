# Product

## Register

product

## Users

Leisure travellers booking premium ground transport — primarily airport transfers, intercity routes, and hotel pickups in luxury and business-class vehicles. They are on mobile or laptop, often mid-trip or pre-trip, frequently in a hurry, and almost always spending more than they would on a rideshare. They want assurance that the booking will work, the vehicle will be appropriate, and the driver will be on time. Secondary audiences include business travellers (repeat bookings, expense receipts) and concierge / hotel partners booking on behalf of guests, but the primary surface is built for the one-off leisure traveller.

The job to be done: turn a known origin + destination + time into a confirmed booking on a vehicle the traveller is happy to be in, with the least possible friction and the most possible signal that this is not a rideshare app.

## Product Purpose

A booking product for premium ground transportation: search a route, pick a vehicle class, complete a checkout, pay, receive a confirmation. The product wins by feeling unmistakably premium without being precious about it — every interaction has to load fast, fit cleanly on a phone, and complete in fewer steps than the competition. Success looks like a traveller booking a $200+ transfer on their phone in under 90 seconds and arriving at the confirmation page without ever questioning whether the booking went through.

The platform is also white-label: businesses (hotels, agencies) get their own subdomain with brand-overridden CSS variables. The customer-facing redesign must remain themeable through the existing CSS-var injection layer.

## Brand Personality

Modern. Technical. Premium.

The voice is **confident-quiet** — the way a good concierge or a good piece of hardware feels. No exclamation marks. No "experience the luxury of." Specifics over adjectives: "Mercedes S-Class, 3 passengers, 4 bags" beats "spacious and elegant vehicle." Numbers and times are first-class typography.

Emotional goals: **trust** (the booking is real, the price is final, the vehicle will arrive), **calm** (no FOMO, no scarcity timers, no upsell carousels), **respect** (the traveller's time, taste, and intelligence). The interface should feel like it was built by people who themselves take these rides.

## Anti-references

This product must explicitly **not** look like:

- **Uber Black / Lyft Lux** — the hyper-utilitarian rideshare aesthetic. Bottom sheets, oversized "BOOK" buttons, map-eats-the-screen layouts, no atmosphere. We are not a rideshare; we should not look like a rideshare with a tuxedo on.
- **Blacklane / generic chauffeur sites** — stock photos of black sedans on wet city streets, navy-and-gold gradient banners, "Premier Worldwide Chauffeur Service" headlines, dropdown-heavy forms. The whole category collapses into the same template.
- **Hotel-shuttle / airport-coach booking sites** — cluttered listings, generic car icons, low-trust vibe, "from $X" pricing chips everywhere. Cheap-feeling chrome.
- **Generic SaaS dashboards** — card-grid-plus-accent-color-plus-sans-serif sameness, the Linear/Notion aesthetic dropped into a context where it doesn't belong. Editorial restraint, not product chrome.

The first-order category reflex is "luxury transport → black + gold → done." Reject it. Our color strategy commits to a quieter, more editorial direction (covered in DESIGN.md), and accent gold — if it appears at all — should be a typographic detail, not a surface treatment.

## Design Principles

1. **Specificity over adjectives.** "Mercedes E-Class · 4 passengers · 6 bags · meet-and-greet" not "spacious luxury sedan with premium service." Every label, button, and confirmation surface earns its place with a real fact.
2. **The number is the hero.** Times, prices, distances, durations, vehicle counts — these are the things travellers actually read. Treat numerics as display typography. Use tabular figures. Make them legible at a glance from three feet away.
3. **Trust through quietness, not loudness.** No badges shouting "100% SECURE." No countdown timers. No "limited spots" guilt. Trust is the absence of suspicion-triggering patterns. Stripe-grade typography, not Groupon-grade urgency.
4. **One commitment per surface.** Each step in the booking journey does one job and does it cleanly. Search is for searching. Selection is for choosing. Checkout is for finishing. No upsell carousels stacked on top of each other.
5. **Calm motion.** Motion exists to confirm state changes and orient the traveller — never to entertain. Exponential ease-out, short durations, no bounce, honor `prefers-reduced-motion`. Long scroll-driven animations belong on the marketing home, not in the booking flow.

## Accessibility & Inclusion

WCAG 2.2 AA across the customer surface. Specifically:

- Contrast ratio ≥ 4.5:1 for body text on every background variant (including white-label overrides).
- Visible focus rings on every interactive element; never `outline: none` without a replacement.
- Full keyboard nav for the entire booking flow — search, vehicle pick, checkout, payment, confirmation must be completable without a mouse.
- `prefers-reduced-motion` honored on every entrance animation, parallax, and carousel.
- All form errors announced via `aria-live` and visually anchored under the field.
- Currency switcher and language affordances reachable from keyboard within two tab stops of the header.
- Touch targets ≥ 44×44 px on mobile.
- Form fields labelled, never relying on placeholder-as-label.

No AAA blanket commitment — would force trade-offs against the editorial type direction — but individual surfaces (payment, confirmation, error states) should hit AAA contrast where the design allows.
