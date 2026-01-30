# Plan: Fix Hero Panel Content to Match Design

## Issue

The AuthHeroPanel content styling doesn't match the HTML design at `design/frontend-design/auth-luxury.html`. The previous fix added `pt-32` which pushes content down instead of having it vertically centered.

## Analysis

**HTML Design (auth-luxury.html):**
- `.hero-panel` has `justify-content: center` (line 216) - content is **vertically centered**
- `.hero-content` has `padding: var(--space-3xl)` = 4rem (line 271)
- Content uses `gap: var(--space-3xl)` = 4rem between sections

**Current React Implementation:**
- CSS correctly has `justify-content: center` on `.auth-hero-panel`
- Component uses `p-12` (3rem) instead of matching the design's 4rem
- My previous fix added `pt-32` which breaks the centered layout

## Solution

Remove the `pt-32` class and update padding to match the HTML design:

**Current:** `className="relative z-10 p-12 pt-32 flex flex-col gap-12"`

**Fixed:** `className="relative z-10 p-16 flex flex-col gap-16"`

- `p-16` = 4rem = matches `var(--space-3xl)` from the design
- `gap-16` = 4rem = matches `gap: var(--space-3xl)` from the design
- Content will be **vertically centered** by the parent's `justify-content: center`

## File to Modify

| File | Change |
|------|--------|
| `components/auth/auth-hero-panel.tsx` | Line 59: Change `p-12 pt-32 ... gap-12` to `p-16 ... gap-16` |

## Verification

1. Navigate to `http://localhost:3001/login`
2. Verify content is **vertically centered** in the hero panel (like in the HTML design)
3. Verify the "Welcome to Infinia" eyebrow has proper spacing from the corner decoration
4. Check content has 4rem padding on all sides and 4rem gaps between sections
5. Compare side-by-side with `design/frontend-design/auth-luxury.html` if needed
