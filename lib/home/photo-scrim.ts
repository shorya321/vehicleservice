/**
 * Photo grading and scrim alphas for full-bleed imagery on the home page.
 *
 * Both follow the theme on purpose. In light the photo keeps its brightness and
 * the scrim washes it toward off-white, so the surface reads pale and airy under
 * dark caption text. In dark the photo is dimmed to 60% and the scrim settles
 * toward near-black under light caption text. --void-rgb and --rich-rgb already
 * flip on their own, so the gradients below are written once.
 *
 * Kept as Tailwind arbitrary-property tokens rather than globals.css rules
 * because they are consumed by exactly two sections, and as one module rather
 * than two copies because the Cities band and the Routes rail must grade their
 * photography identically or the page reads as two different photo sets.
 *
 * Apply SCRIM_TOKENS to the section, SCRIM to the overlay element inside it.
 */
export const SCRIM_TOKENS = [
  '[--scrim-anchor:0.84] dark:[--scrim-anchor:0.90]',
  '[--scrim-mid:0.52]',
  '[--scrim-open:0.10]',
  '[--media-filter:saturate(0.86)_contrast(0.98)_brightness(1)]',
  'dark:[--media-filter:saturate(0.9)_contrast(1.05)_brightness(0.6)]',
].join(' ')

export const SCRIM =
  'bg-[linear-gradient(to_top,rgba(var(--void-rgb),var(--scrim-anchor))_0%,rgba(var(--rich-rgb),var(--scrim-mid))_44%,rgba(var(--void-rgb),var(--scrim-open))_100%),linear-gradient(to_right,rgba(var(--void-rgb),var(--scrim-mid))_0%,transparent_64%)]'
