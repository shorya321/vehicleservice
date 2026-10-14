/**
 * Shared email style constants.
 * Single source of truth for all platform email styling.
 *
 * Static on purpose: shared templates (customer, vendor, driver, auth, wallet, admin)
 * always paint in the platform palette, computed once from PLATFORM_BRAND_COLORS. The
 * business module keeps its own brand-aware copy in lib/business/email/styles.
 */

import { PLATFORM_BRAND_COLORS } from '../brand/brand';
import {
  EMAIL_FONT_DISPLAY,
  EMAIL_FONT_MONO,
  EMAIL_FONT_SANS,
  emailPalette,
} from '../brand/palette';

export const palette = emailPalette(PLATFORM_BRAND_COLORS);

export const fonts = {
  display: EMAIL_FONT_DISPLAY,
  sans: EMAIL_FONT_SANS,
  mono: EMAIL_FONT_MONO,
} as const;

export const emailStyles = {
  // Text styles
  text: {
    color: palette.body,
    fontFamily: fonts.sans,
    fontSize: '15px',
    lineHeight: '25px',
    margin: '0 0 16px',
  },

  /** A sub-heading inside the body, below the hero headline. */
  heading: {
    color: palette.ink,
    fontFamily: fonts.display,
    fontSize: '20px',
    fontWeight: '500',
    lineHeight: '1.35',
    margin: '28px 0 12px',
  },

  link: {
    color: palette.accentInk,
    textDecoration: 'underline',
  },

  linkWithMargin: {
    color: palette.accentInk,
    fontFamily: fonts.mono,
    fontSize: '12px',
    lineHeight: '19px',
    textDecoration: 'underline',
    wordBreak: 'break-all' as const,
    margin: '0 0 16px',
  },

  // Detail/Info rows
  detailRow: {
    color: palette.ink,
    fontFamily: fonts.sans,
    fontSize: '14px',
    lineHeight: '22px',
    margin: '6px 0',
  },

  totalRow: {
    color: palette.ink,
    fontFamily: fonts.sans,
    fontSize: '16px',
    fontWeight: '600',
    lineHeight: '24px',
    margin: '8px 0',
  },

  // List styles
  list: {
    margin: '0 0 16px 0',
    paddingLeft: '22px',
  },

  listItem: {
    color: palette.body,
    fontFamily: fonts.sans,
    fontSize: '15px',
    lineHeight: '25px',
    margin: '4px 0',
  },

  // Divider
  hr: {
    borderColor: palette.line,
    borderTopWidth: '1px',
    margin: '14px 0',
  },

  /** Secondary captions. */
  muted: {
    color: palette.muted,
    fontFamily: fonts.sans,
    fontSize: '13px',
    lineHeight: '20px',
    margin: '0 0 16px',
  },
} as const;

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

// Container/Box styles
export const boxStyles = {
  // Neutral details card (used for booking details, application info, etc.)
  details: {
    backgroundColor: palette.card,
    border: `1px solid ${palette.line}`,
    borderRadius: '12px',
    padding: '14px 20px',
    margin: '20px 0',
  },

  info: {
    container: { ...boxBase, backgroundColor: palette.pale, border: `1px solid ${palette.paleLine}` },
    title: { ...boxTitle, color: palette.accentInk },
    text: { ...boxText, color: '#5c4a2c' },
  },

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

  // Quoted message from a person (contact replies, notes)
  message: {
    container: { ...boxBase, backgroundColor: palette.soft, border: `1px solid ${palette.line}` },
    title: { ...boxTitle, color: palette.muted, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' as const },
    text: { ...boxText, color: palette.ink },
  },
} as const;

// Color palette for status indicators
export const statusColors = {
  confirmed: '#10b981',
  completed: '#3b82f6',
  cancelled: '#ef4444',
  progress: '#f59e0b',
  pending: '#6b7280',
  default: '#6b7280',
} as const;

/** Notice tones, shared by the layout's eyebrow and the InfoBox. */
export const toneInk = {
  info: palette.accentInk,
  success: '#065f46',
  warning: '#7a5410',
  danger: '#8a2b20',
} as const;

export type EmailTone = keyof typeof toneInk;
