---
name: Infinia Transfers
description: Premium ground-transfer booking. Editorial-luxury skin over a precise booking product.
colors:
  onyx: "#050506"
  obsidian: "#0a0a0b"
  warm-black: "#0f0e0d"
  slate-velvet: "#161514"
  slate-velvet-raised: "#1f1e1c"
  graphite: "#2a2826"
  vellum-gold: "#c6aa88"
  vellum-gold-deep: "#b89b6a"
  vellum-gold-dark: "#a68b5b"
  vellum-gold-shadow: "#8b7349"
  linen-gold-pale: "#f4ece0"
  linen-gold-cream: "#e8d9c5"
  linen-gold-light: "#d4c4a8"
  bone: "#f8f6f3"
  ash: "#b8b4ae"
  ash-muted: "#9a9692"
  destructive: "#ef4444"
typography:
  display:
    fontFamily: "TT Commons Pro, Inter, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 6vw, 5rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "TT Commons Pro, Inter, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 3vw, 2.5rem)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "TT Commons Pro, Inter, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "0"
  body:
    fontFamily: "TT Commons Pro, Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "0.01em"
  numeric:
    fontFamily: "TT Commons Pro, Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0"
    fontFeature: "\"tnum\" 1, \"lnum\" 1"
  label:
    fontFamily: "TT Commons Pro, Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.12em"
rounded:
  none: "0"
  sm: "4px"
  md: "8px"
  lg: "12px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  2xl: "64px"
  3xl: "96px"
  4xl: "128px"
components:
  button-primary:
    backgroundColor: "{colors.vellum-gold}"
    textColor: "{colors.onyx}"
    rounded: "{rounded.sm}"
    padding: "14px 28px"
  button-primary-hover:
    backgroundColor: "{colors.vellum-gold-deep}"
    textColor: "{colors.onyx}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.vellum-gold}"
    rounded: "{rounded.sm}"
    padding: "14px 28px"
  button-secondary-hover:
    backgroundColor: "{colors.slate-velvet-raised}"
    textColor: "{colors.linen-gold-pale}"
  input-field:
    backgroundColor: "{colors.warm-black}"
    textColor: "{colors.bone}"
    rounded: "{rounded.sm}"
    padding: "14px 16px"
    height: "52px"
  card-surface:
    backgroundColor: "{colors.slate-velvet}"
    textColor: "{colors.bone}"
    rounded: "{rounded.md}"
    padding: "24px"
  chip-numeric:
    backgroundColor: "{colors.warm-black}"
    textColor: "{colors.linen-gold-pale}"
    rounded: "{rounded.sm}"
    padding: "6px 10px"
---

# Design System: Infinia Transfers

## 1. Overview

**Creative North Star: "The Composed Itinerary"**

The system is a dark, editorially-disciplined surface for a booking product that treats every traveller fact — origin, destination, time, vehicle class, passenger count, bag count, price — as typographic material. Black-warm grounds, vellum-gold accents, TT Commons Pro at varying weights and scales. The vocabulary is taken from luggage tags, ledger pages, and itinerary cards rather than rideshare apps or chauffeur marketing.

This system rejects the first-order category reflex of "luxury transport → black + gold gradient banner + stock sedan photo." It commits to dark, but uses the gold as a typographic and edge accent — never as a fill on large surfaces. Numbers are treated as display elements. Spacing is generous on brand surfaces, dense on product surfaces. Motion is restrained: ease-out exponential curves, short durations, no bounce, no parallax inside the booking flow.

The same tokens render the marketing home (brand register) and the booking journey (product register). Density and motion budget differ per surface; tokens do not.

**Key Characteristics:**
- Dark-warm grounds tinted toward gold (chroma never zero) — never `#000`, never `#fff`.
- Single geometric sans (TT Commons Pro) at committed weight and scale contrasts, with generous body line-height.
- Vellum gold as a typographic detail and edge stroke, **not** as a fill on more than ~10% of any surface.
- Numbers (prices, times, distances, durations) carry tabular figures and a slight weight bump.
- Motion exists to confirm state, never to entertain. `prefers-reduced-motion` is honored everywhere.

## 2. Colors

A warm-cold dark palette, tinted, with a single accent family used like a maker's mark.

### Primary

- **Vellum Gold** (`#c6aa88`): the brand accent. Appears in numerals, button fills, focus rings, hairline edges, and decorative inflection points. Never on more than ~10% of any given surface. Has three deeper companions for hover (`vellum-gold-deep #b89b6a`), pressed (`vellum-gold-dark #a68b5b`), and shadow under-tones (`vellum-gold-shadow #8b7349`).
- **Linen Gold (Pale)** (`#f4ece0`): the lightest gold, used as a near-white for high-emphasis numerals and inverted button text where bone-on-gold contrast needs lifting.

### Neutral

- **Onyx** (`#050506`): the lowest surface. Page background on dark sections, modal backdrop.
- **Obsidian** (`#0a0a0b`): the page ground for most surfaces. Sits just above onyx so layered elements have somewhere to come from.
- **Warm Black** (`#0f0e0d`): input fields, raised content within a section.
- **Slate Velvet** (`#161514`): card surfaces, sidebar grounds.
- **Slate Velvet Raised** (`#1f1e1c`): hover and selected states on cards and list items.
- **Graphite** (`#2a2826`): hairline borders, divider grounds, popover surfaces.
- **Bone** (`#f8f6f3`): default text color. Reads as warm white over dark grounds.
- **Ash** (`#b8b4ae`): secondary text, captions, helper text.
- **Ash Muted** (`#9a9692`): tertiary text, placeholder text.

### Named Rules

**The One Voice Rule.** Vellum Gold covers ≤10% of any composed surface — numerals, focus rings, button fills, edge accents. Its rarity is the point. Anything more than that and the page becomes the category cliché.

**The Tinted Neutral Rule.** Every neutral tints warm-toward-gold (a trace of chroma in the same hue family as Vellum Gold). Pure greyscale is forbidden. Pure black (`#000`) and pure white (`#fff`) are forbidden.

**The No-Gradient-Text Rule.** Background-clipped gradient on type is forbidden. Emphasis lives in weight, size, and color contrast — never in a gradient fill.

## 3. Typography

**Primary Font:** TT Commons Pro (with Inter, system-ui, sans-serif fallback)
**Numeric Font:** TT Commons Pro with `font-variant-numeric: tabular-nums lining-nums` — numbers are aligned vertically and weighted up half a step.

**Character:** A single geometric sans used at committed weight and scale contrasts. Display sizes run heavy (600) for authority; body runs light (400) for readability. Hierarchy lives in size jumps and weight steps, not in font-family switching. The result reads editorial first, technical second — never SaaS, never rideshare. Emphasis comes from gold color and weight contrast.

### Hierarchy

- **Display** (TT Commons Pro 600, `clamp(2.75rem, 6vw, 5rem)`, line-height 1.05): hero titles, peak-moment headlines (confirmation page, hero), once per surface.
- **Headline** (TT Commons Pro 600, `clamp(1.75rem, 3vw, 2.5rem)`, line-height 1.15): section titles, page H1 inside the booking flow.
- **Title** (TT Commons Pro 500, `1.125rem`, line-height 1.35): card titles, form section labels, list-item primary lines.
- **Body** (TT Commons Pro 400, `1rem`, line-height 1.7, max line length 65–75ch): paragraph text, descriptions, helper copy.
- **Numeric** (TT Commons Pro 500, `1rem`, tabular figures): prices, durations, distances, passenger counts, bag counts, vehicle counts. Numbers are first-class citizens, not body text.
- **Label** (TT Commons Pro 500, `0.75rem`, letter-spacing 0.12em, uppercase): eyebrows, status pills, step indicators.

### Named Rules

**The Numerals-Are-Display Rule.** Any number a traveller reads to make a decision (prices, times, distances, durations, capacities) gets the Numeric role — tabular figures, half-step weight bump, sized large enough to read across a phone at arm's length. Numbers shrunk into body copy are forbidden.

**The Line-Length Rule.** Body copy caps at 75ch. Never run paragraphs the full width of a desktop container without a measure cap.

## 4. Elevation

The system is **flat-by-tone**. Depth is conveyed by stepping through neutrals (onyx → obsidian → warm-black → slate-velvet → slate-velvet-raised → graphite) and by a single hairline border (1px, `graphite` or `vellum-gold` at low opacity), not by shadow blur. Shadows exist only as soft ambient gold under hover-active accent buttons and elevated CTA cards.

### Shadow Vocabulary

- **Gold ambient** (`box-shadow: 0 10px 20px -5px rgba(198, 170, 136, 0.15), 0 4px 8px -4px rgba(198, 170, 136, 0.1)`): under hover-state primary buttons and CTA cards. Soft, warm, low-blur.

### Named Rules

**The Flat-By-Tone Rule.** Cards do not float. They sit on a darker ground and rise by tone, not by drop shadow. The only shadow allowed under a default-state surface is the gold ambient on an interactive accent.

**The No-Nested-Card Rule.** Cards never contain cards. If you need to group elements inside a card, use a hairline divider or a tone step — never another rounded surface.

## 5. Components

### Buttons

- **Shape:** lightly rounded (`4px`). Never pill, never square-corner, never large-radius (≥16px).
- **Primary:** Vellum Gold fill, Onyx text, uppercase optional, weight 500, padding `14px 28px`. Hover: deepen to `vellum-gold-deep`, lift `translateY(-2px)`, gold ambient shadow appears.
- **Secondary / Ghost:** transparent fill, 1px Vellum Gold border, Vellum Gold text. Hover: Slate Velvet Raised background, Linen Gold Pale text. The border stays the same color through hover — only the fill darkens.
- **Tertiary / Link:** text-only, Vellum Gold, underline-from-zero on hover (`background-image` underline, not `text-decoration`).
- **Focus:** 2px Vellum Gold outline with 2px offset on every variant. Never `outline: none`.

### Inputs / Fields

- **Style:** Warm Black background, 1px Graphite border, `4px` radius, height 52px on touch, 44px on dense desktop forms. Bone text, Ash Muted placeholder. Padding `14px 16px`.
- **Focus:** border transitions to Vellum Gold (1px); a 4px ring of Vellum Gold at 15% opacity blooms outside the border.
- **Error:** border to `destructive`, helper text in `destructive` below the field. Error message announced via `aria-live="polite"`.
- **Label:** floating above the field in Label type (uppercase, 0.12em letter-spacing). Never placeholder-as-label.

### Cards / Containers

- **Shape:** `8px` radius for most, `12px` for hero-class containers (e.g. CTA cards on the home page).
- **Background:** Slate Velvet by default; Warm Black for inset / nested surfaces (one tone step down).
- **Border:** 1px Graphite hairline, or 1px Vellum Gold at 15% opacity for accent-marked cards.
- **Shadow:** none at rest. Hover (interactive cards only) lifts `translateY(-4px)` and gains the gold ambient shadow.
- **Internal padding:** `24px` standard, `32px` on hero cards, `16px` on dense list rows.

### Chips / Pills

- **Numeric chip** (price ribbon, passenger count, bag count): Warm Black fill, Linen Gold Pale numeral, 1px Graphite border, 4px radius. Tabular figures. No icon to the left of a number — the number is the icon.
- **Status pill** (booking status, vehicle class): Slate Velvet Raised fill, Vellum Gold text, Label type, 4px radius, padding `4px 10px`.

### Navigation

- **Header:** sticky, Onyx ground with 1px Graphite bottom border on scroll. Links are Outfit 500, Bone, with Vellum Gold underline-from-zero on hover. Active link uses Vellum Gold text + 1px underline.
- **Mobile menu:** slide-in from right, full-height, Obsidian ground. Items stack with `16px` vertical rhythm, Title type, hairline dividers between sections.

### Signature: The Itinerary Block

A horizontal arrangement of [origin] → [destination] / [date] · [time] / [vehicle class] · [passenger count] · [bag count] / [price]. Each segment is its own typographic unit separated by hairline rules or 1ch of whitespace. No icons. The segments form the visual identity of the booking flow — every step (search summary, vehicle card, order summary, confirmation) re-uses this block, scaled and weighted differently.

## 6. Do's and Don'ts

### Do:

- **Do** use Vellum Gold (`#c6aa88`) as a typographic accent and edge stroke. Restrict its surface coverage to ≤10% per page.
- **Do** treat numerals (prices, times, distances, durations, counts) as display typography. Tabular figures, half-step weight bump.
- **Do** tint every neutral with a trace of warm gold chroma. Pure greyscale is forbidden.
- **Do** convey depth with tone steps (onyx → obsidian → warm-black → slate-velvet → slate-velvet-raised) and 1px hairline borders. Shadows only for hover on accent CTAs.
- **Do** honor `prefers-reduced-motion` on every entrance animation. Restrained ease-out, short durations, no bounce.
- **Do** reuse the Itinerary Block pattern across search summary, vehicle card, order summary, and confirmation. The product's typographic identity lives there.
- **Do** keep body line-length at 65–75ch.
- **Do** size primary tap targets ≥44px on mobile.

### Don't:

- **Don't** look like **Uber Black / Lyft Lux**. No bottom sheets, no oversized "BOOK NOW" buttons, no map-eats-the-screen layouts. We are not a rideshare.
- **Don't** look like **Blacklane** or any generic chauffeur site. No stock photo of a black sedan on a wet street. No navy-and-gold gradient banner. No "Premier Worldwide Chauffeur Service" headlines.
- **Don't** look like a **hotel-shuttle / airport-coach** booking site. No cluttered listings, no generic car icons, no "from $X" pricing chips repeated down a page.
- **Don't** look like a **generic SaaS dashboard**. No identical card grids of icon + heading + body. No accent-color-as-personality. No Linear/Notion chrome dropped into a context that doesn't need it.
- **Don't** use `background-clip: text` on a gradient. Forbidden everywhere.
- **Don't** use side-stripe borders. A `border-left` or `border-right` greater than 1px as a colored accent on cards, list items, callouts, or alerts is forbidden. Use full borders, background tints, or leading numerals/labels instead.
- **Don't** stack cards inside cards. If grouping is needed, use a hairline divider or a tone step.
- **Don't** use trust badges that shout (`100% SECURE!!`), countdown timers, or scarcity messaging. Trust is the absence of suspicion-triggering patterns.
- **Don't** use pure black (`#000`) or pure white (`#fff`) anywhere. Anywhere.
- **Don't** treat the hero-metric template (big number + small label + 3 supporting stats with gradient accent) as a default. It is the SaaS landing-page cliché in costume. The Itinerary Block replaces it.
- **Don't** animate CSS layout properties. Compose transforms and opacity only.
