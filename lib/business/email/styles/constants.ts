/**
 * The business email palette.
 *
 * Started as a copy of lib/email/styles/constants.ts and diverged in one respect: every
 * colour a tenant can influence is resolved from their brand at property-access time
 * rather than frozen at module load.
 *
 * Why getters rather than `emailStyles(brand)` functions: templates consume these as
 * `style={emailStyles.text}`, and every render already happens inside the brand scope
 * that sendBusinessEmail establishes. Getters keep the tenant palette flowing without
 * threading a brand argument through every template and component.
 * The indirection is real, which is why it is written down here.
 *
 * Outside a send there is no brand in scope and getBusinessBrand() returns the platform
 * palette, so previews and tests render the platform look.
 *
 * Deliberately NOT tenant-coloured: statusColors, and the success/warning/error boxes.
 * Those encode meaning rather than identity. A tenant whose accent happens to be red
 * must not end up with a red "confirmed" badge, and a green "cancelled" badge would be
 * worse than an off-brand one. The info and message boxes are neutral, so they take the
 * tenant's tint.
 */

import {
  EMAIL_FONT_DISPLAY,
  EMAIL_FONT_MONO,
  EMAIL_FONT_SANS,
  getBusinessPalette,
} from '../brand';

export const fonts = {
  display: EMAIL_FONT_DISPLAY,
  sans: EMAIL_FONT_SANS,
  mono: EMAIL_FONT_MONO,
} as const;

/** The current brand's palette. Call during render, never at module load. */
export const palette = getBusinessPalette;

export const emailStyles = {
  get text() {
    return {
      color: palette().body,
      fontFamily: fonts.sans,
      fontSize: '15px',
      lineHeight: '25px',
      margin: '0 0 16px',
    };
  },

  /** A sub-heading inside the body, below the hero headline. */
  get heading() {
    return {
      color: palette().ink,
      fontFamily: fonts.display,
      fontSize: '20px',
      fontWeight: '500',
      lineHeight: '1.35',
      margin: '28px 0 12px',
    };
  },

  get link() {
    return {
      color: palette().accentInk,
      textDecoration: 'underline',
    };
  },

  get linkWithMargin() {
    return {
      color: palette().accentInk,
      fontFamily: fonts.mono,
      fontSize: '12px',
      lineHeight: '19px',
      textDecoration: 'underline',
      wordBreak: 'break-all' as const,
      margin: '0 0 16px',
    };
  },

  get detailRow() {
    return {
      color: palette().ink,
      fontFamily: fonts.sans,
      fontSize: '14px',
      lineHeight: '22px',
      margin: '6px 0',
    };
  },

  get totalRow() {
    return {
      color: palette().ink,
      fontFamily: fonts.sans,
      fontSize: '16px',
      fontWeight: '600',
      lineHeight: '24px',
      margin: '8px 0',
    };
  },

  /** No colour of its own: indentation only. */
  list: {
    margin: '0 0 16px 0',
    paddingLeft: '22px',
  },

  get listItem() {
    return {
      color: palette().body,
      fontFamily: fonts.sans,
      fontSize: '15px',
      lineHeight: '25px',
      margin: '4px 0',
    };
  },

  get hr() {
    return {
      borderColor: palette().line,
      borderTopWidth: '1px',
      margin: '14px 0',
    };
  },

  /** Secondary captions. */
  get muted() {
    return {
      color: palette().muted,
      fontFamily: fonts.sans,
      fontSize: '13px',
      lineHeight: '20px',
      margin: '0 0 16px',
    };
  },
};

const boxBase = {
  borderRadius: '10px',
  padding: '16px 20px',
  margin: '20px 0',
} as const;

const boxTitle = {
  fontFamily: fonts.sans,
  fontSize: '14px',
  fontWeight: '600',
  lineHeight: '20px',
  margin: '0 0 4px',
} as const;

const boxText = {
  fontFamily: fonts.sans,
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
} as const;

export const boxStyles = {
  /** The neutral details card. Follows the tenant's surface and border. */
  get details() {
    const p = palette();

    return {
      backgroundColor: p.card,
      border: `1px solid ${p.line}`,
      borderRadius: '12px',
      padding: '14px 20px',
      margin: '20px 0',
    };
  },

  /** Neutral guidance, tinted with the tenant's accent. */
  get info() {
    const p = palette();

    return {
      container: { ...boxBase, backgroundColor: p.pale, border: `1px solid ${p.paleLine}` },
      title: { ...boxTitle, color: p.accentInk },
      text: { ...boxText, color: p.ink },
    };
  },

  // The three below are semantic and stay fixed across tenants.

  success: {
    container: { ...boxBase, backgroundColor: '#ecf7f1', border: '1px solid #10b981' },
    title: { ...boxTitle, color: '#065f46' },
    text: { ...boxText, color: '#14532d' },
  },

  warning: {
    container: { ...boxBase, backgroundColor: '#fbf3e2', border: '1px solid #f0dfb8' },
    title: { ...boxTitle, color: '#7a5410' },
    text: { ...boxText, color: '#6b5222' },
  },

  error: {
    container: { ...boxBase, backgroundColor: '#fbeceb', border: '1px solid #f2d0cc' },
    title: { ...boxTitle, color: '#8a2b20' },
    text: { ...boxText, color: '#7a3a32' },
  },

  /** A quoted note from a person. */
  get message() {
    const p = palette();

    return {
      container: { ...boxBase, backgroundColor: p.soft, border: `1px solid ${p.line}` },
      title: {
        ...boxTitle,
        color: p.muted,
        fontSize: '12px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
      },
      text: { ...boxText, color: p.ink },
    };
  },
};

/** Status meaning, not tenant identity. Fixed on purpose. */
export const statusColors = {
  confirmed: '#10b981',
  completed: '#3b82f6',
  cancelled: '#ef4444',
  progress: '#f59e0b',
  pending: '#6b7280',
  default: '#6b7280',
} as const;

const FIXED_TONE_INK = {
  success: '#065f46',
  warning: '#7a5410',
  danger: '#8a2b20',
} as const;

export type EmailTone = 'info' | keyof typeof FIXED_TONE_INK;

/** Eyebrow colour for a tone. Info follows the tenant; the rest carry meaning. */
export function toneInk(tone: EmailTone): string {
  return tone === 'info' ? palette().accentInk : FIXED_TONE_INK[tone];
}
