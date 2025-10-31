/**
 * Shared email style constants
 * Single source of truth for all email styling
 */

export const emailStyles = {
  // Text styles
  text: {
    color: '#525f7f',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '0 0 16px',
  },

  heading: {
    color: '#1a1a1a',
    fontSize: '24px',
    fontWeight: '600',
    lineHeight: '1.4',
    margin: '0 0 24px',
  },

  link: {
    color: '#556cd6',
    textDecoration: 'underline',
  },

  linkWithMargin: {
    color: '#556cd6',
    fontSize: '14px',
    textDecoration: 'underline',
    wordBreak: 'break-all' as const,
    margin: '0 0 16px',
  },

  // Detail/Info rows
  detailRow: {
    color: '#2d3748',
    fontSize: '14px',
    lineHeight: '20px',
    margin: '8px 0',
  },

  totalRow: {
    color: '#1a202c',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '8px 0',
  },

  // List styles
  list: {
    margin: '0 0 16px 0',
    paddingLeft: '24px',
  },

  listItem: {
    color: '#525f7f',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '4px 0',
  },

  // Divider
  hr: {
    borderColor: '#e2e8f0',
    margin: '16px 0',
  },
} as const;

// Container/Box styles
export const boxStyles = {
  // Gray details box (used for booking details, application info, etc.)
  details: {
    backgroundColor: '#f7fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '24px',
    margin: '24px 0',
  },

  // Blue info box
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

  // Green success box
  success: {
    container: {
      backgroundColor: '#f0fdf4',
      border: '2px solid #10b981',
      borderRadius: '8px',
      padding: '16px',
      margin: '24px 0',
      textAlign: 'center' as const,
    },
    text: {
      color: '#065f46',
      fontSize: '18px',
      lineHeight: '28px',
      margin: '0',
    },
  },

  // Warning box (yellow/orange)
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

  // Message box (lighter blue than info)
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

// Color palette for status indicators
export const statusColors = {
  confirmed: '#10b981',
  completed: '#3b82f6',
  cancelled: '#ef4444',
  progress: '#f59e0b',
  pending: '#6b7280',
  default: '#6b7280',
} as const;
