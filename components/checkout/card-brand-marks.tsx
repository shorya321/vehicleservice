/**
 * The card schemes the gateway accepts, as their own marks.
 *
 * They were three text chips reading "Visa", "Mastercard", "Amex" in the page's own uppercase
 * label treatment, which is how the site labels its own things. A scheme mark is not our label:
 * it is the thing the customer matches against the card in their hand, and they match it by
 * shape and colour long before they read it.
 *
 * Drawn inline rather than fetched: three network requests for three 30px images on the screen
 * where someone decides to trust us with a card is a poor trade, and a missing image there reads
 * as a broken payment page. Each mark sits on its own white plate, the way a scheme mark is
 * always presented, so it reads identically in both themes.
 */

const PLATE = 'rounded-[3px] bg-white'

export function VisaMark() {
  return (
    <svg
      className={PLATE}
      width="34"
      height="22"
      viewBox="0 0 34 22"
      role="img"
      aria-label="Visa"
    >
      <text
        x="17"
        y="15.5"
        textAnchor="middle"
        fontFamily="var(--font-body), Inter, system-ui, sans-serif"
        fontSize="10"
        fontWeight="700"
        fontStyle="italic"
        letterSpacing="0.02em"
        fill="#1434CB"
      >
        VISA
      </text>
    </svg>
  )
}

export function MastercardMark() {
  return (
    <svg
      className={PLATE}
      width="34"
      height="22"
      viewBox="0 0 34 22"
      role="img"
      aria-label="Mastercard"
    >
      <circle cx="14" cy="11" r="6.4" fill="#EB001B" />
      <circle cx="20" cy="11" r="6.4" fill="#F79E1B" />
      {/* The overlap. Two circles 6 apart with r=6.4 meet at x=17, y=11±5.66. */}
      <path d="M17 5.34a6.4 6.4 0 0 0 0 11.32 6.4 6.4 0 0 0 0-11.32Z" fill="#FF5F00" />
    </svg>
  )
}

export function AmexMark() {
  return (
    <svg
      className={PLATE}
      width="34"
      height="22"
      viewBox="0 0 34 22"
      role="img"
      aria-label="American Express"
    >
      <rect width="34" height="22" rx="3" fill="#006FCF" />
      <text
        x="17"
        y="14.6"
        textAnchor="middle"
        fontFamily="var(--font-body), Inter, system-ui, sans-serif"
        fontSize="7.5"
        fontWeight="700"
        letterSpacing="0.04em"
        fill="#FFFFFF"
      >
        AMEX
      </text>
    </svg>
  )
}

/** In the order the schemes are listed in the Terms. */
export const CARD_BRAND_MARKS = [
  { key: 'visa', Mark: VisaMark },
  { key: 'mastercard', Mark: MastercardMark },
  { key: 'amex', Mark: AmexMark },
] as const
