# Plan: Fix Currency Modal Search Box Background

## Context
The search input in the currency modal has a grayish background (`bg-[var(--charcoal)]/80`) that doesn't match the modal popup's background (`bg-[var(--charcoal)]/[0.97]`). The user wants the search box to seamlessly blend with the popup.

## File to Modify
`components/currency/currency-modal.tsx` — line 74

## Change
Replace the search input's background classes to use `bg-transparent` so it matches the modal exactly, keeping the border for visual definition:

| Property | Current | New |
|----------|---------|-----|
| Default bg | `bg-[var(--charcoal)]/80` | `bg-transparent` |
| Focus bg | `focus:bg-[var(--charcoal)]/90` | `focus:bg-white/[0.03]` |

The input will blend seamlessly with the popup. The subtle `focus:bg-white/[0.03]` gives a barely-visible brightness bump on focus for UX feedback.

## Verification
1. Open currency modal — search box should blend with popup background (no grayish box)
2. Focus search box — very subtle highlight
3. Text and placeholder remain readable
