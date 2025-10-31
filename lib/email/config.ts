import { Resend } from 'resend';

// Lazy initialization of Resend client
let resendClient: Resend | null = null;

/**
 * Get or initialize the Resend client
 * Only validates environment variables when actually used (server-side)
 */
export const getResendClient = (): Resend => {
  if (resendClient) {
    return resendClient;
  }

  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not defined in environment variables');
  }

  resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
};

/**
 * Email configuration
 * Only validates when accessed (server-side)
 */
export const getEmailConfig = () => {
  if (!process.env.RESEND_FROM_EMAIL) {
    throw new Error('RESEND_FROM_EMAIL is not defined in environment variables');
  }

  return {
    from: process.env.RESEND_FROM_EMAIL,
    replyTo: process.env.RESEND_REPLY_TO_EMAIL || process.env.RESEND_FROM_EMAIL,
  } as const;
};

/**
 * Get application URL
 * Works on both client and server by checking NEXT_PUBLIC_APP_URL first
 */
export const getAppUrl = (): string => {
  // Check public env var first (available on both client and server)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Fallback to localhost in development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001';
  }

  // Production fallback
  return 'https://yourdomain.com';
};

/**
 * Get admin notification email address
 * Defaults to RESEND_FROM_EMAIL if not specified
 */
export const getAdminEmail = (): string => {
  if (process.env.ADMIN_NOTIFICATION_EMAIL) {
    return process.env.ADMIN_NOTIFICATION_EMAIL;
  }

  // Fallback to from email
  if (process.env.RESEND_FROM_EMAIL) {
    return process.env.RESEND_FROM_EMAIL;
  }

  throw new Error('ADMIN_NOTIFICATION_EMAIL or RESEND_FROM_EMAIL must be defined');
};
