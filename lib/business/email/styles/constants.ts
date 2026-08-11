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
 * threading a brand argument through thirteen templates and every component they use.
 * The indirection is real, which is why it is written down here.
 *
 * Outside a send there is no brand in scope and getBusinessBrand() returns the platform
 * palette, so previews and tests render the same colours they always did.
 *
 * Deliberately NOT tenant-coloured: statusColors, and the info/success/warning boxes.
 * Those encode meaning rather than identity. A tenant whose accent happens to be red
 * must not end up with a red "confirmed" badge, and a green "cancelled" badge would be
 * worse than an off-brand one.
 */

import { getBusinessBrand } from '../platform';

export const emailStyles = {
  get text() {
    return {
      color: getBusinessBrand().colors.text,
      fontSize: '16px',
      lineHeight: '24px',
      margin: '0 0 16px',
    };
  },

  get heading() {
    return {
      color: getBusinessBrand().colors.heading,
      fontSize: '24px',
      fontWeight: '600',
      lineHeight: '1.4',
      margin: '0 0 24px',
    };
  },

  get link() {
    return {
      color: getBusinessBrand().colors.primary,
      textDecoration: 'underline',
    };
  },

  get linkWithMargin() {
    return {
      color: getBusinessBrand().colors.primary,
      fontSize: '14px',
      textDecoration: 'underline',
      wordBreak: 'break-all' as const,
      margin: '0 0 16px',
    };
  },

  get detailRow() {
    return {
      color: getBusinessBrand().colors.heading,
      fontSize: '14px',
      lineHeight: '20px',
      margin: '8px 0',
    };
  },

  get totalRow() {
    return {
      color: getBusinessBrand().colors.heading,
      fontSize: '16px',
      lineHeight: '24px',
      margin: '8px 0',
    };
  },

  /** No colour of its own: indentation only. */
  list: {
    margin: '0 0 16px 0',
    paddingLeft: '24px',
  },

  get listItem() {
    return {
      color: getBusinessBrand().colors.text,
      fontSize: '16px',
      lineHeight: '24px',
      margin: '4px 0',
    };
  },

  get hr() {
    return {
      borderColor: getBusinessBrand().colors.border,
      margin: '16px 0',
    };
  },

  /** Secondary captions. Was an inline #666666 in two templates before this existed. */
  get muted() {
    return {
      color: getBusinessBrand().colors.muted,
      fontSize: '14px',
      lineHeight: '20px',
      margin: '0 0 16px',
    };
  },
};

export const boxStyles = {
  /** The neutral details box. Follows the tenant's surface and border. */
  get details() {
    const { colors } = getBusinessBrand();

    return {
      backgroundColor: colors.background,
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      padding: '24px',
      margin: '24px 0',
    };
  },

  // Everything below is semantic and stays fixed across tenants.

  info: {
    container: {
      backgroundColor: '#eff6ff',
      border: '1px solid #bfdbfe',
      borderRadius: '8px',
      padding: '20px',
      margin: '20px 0',
    },
    title: {
      color: '#1e40af',
      fontSize: '16px',
      fontWeight: 'bold',
      margin: '0 0 12px',
    },
    text: {
      color: '#1e3a8a',
      fontSize: '14px',
      lineHeight: '20px',
      margin: '0',
    },
  },

  success: {
    container: {
      backgroundColor: '#f0fdf4',
      border: '2px solid #10b981',
      borderRadius: '8px',
      padding: '16px',
      margin: '24px 0',
      textAlign: 'center' as const,
    },
    title: {
      color: '#065f46',
      fontSize: '16px',
      fontWeight: 'bold',
      margin: '0 0 12px',
    },
    text: {
      color: '#065f46',
      fontSize: '18px',
      lineHeight: '28px',
      margin: '0',
    },
  },

  warning: {
    container: {
      backgroundColor: '#fffbeb',
      border: '1px solid #fcd34d',
      borderRadius: '8px',
      padding: '20px',
      margin: '20px 0',
    },
    title: {
      color: '#92400e',
      fontSize: '16px',
      fontWeight: 'bold',
      margin: '0 0 12px',
    },
    text: {
      color: '#78350f',
      fontSize: '14px',
      lineHeight: '20px',
      margin: '0',
    },
  },

  message: {
    container: {
      backgroundColor: '#eff6ff',
      border: '1px solid #bfdbfe',
      borderRadius: '8px',
      padding: '16px',
      margin: '16px 0',
    },
    title: {
      color: '#1e40af',
      fontSize: '14px',
      fontWeight: 'bold',
      margin: '0 0 8px',
    },
    text: {
      color: '#1e3a8a',
      fontSize: '14px',
      lineHeight: '20px',
      margin: '0',
    },
  },
} as const;

/** Status meaning, not tenant identity. Fixed on purpose. */
export const statusColors = {
  confirmed: '#10b981',
  completed: '#3b82f6',
  cancelled: '#ef4444',
  progress: '#f59e0b',
  pending: '#6b7280',
  default: '#6b7280',
} as const;
