/**
 * Public surface of the mail transport layer.
 *
 * Nothing outside lib/email/ should import the sub-modules directly.
 */

export type {
  EmailBrand,
  MailDeliveryStatus,
  MailIdentity,
  MailProvider,
  ResolvedMailConfig,
  SafeSmtpError,
  SmtpTransportConfig,
} from './types';

export {
  MailCryptoConfigError,
  MailCryptoError,
  decryptSecret,
  encryptSecret,
  envelopeKeyVersion,
  isEncryptedEnvelope,
  isMailCryptoConfigured,
  maskSecret,
  redactSecrets,
  secretsMatch,
} from './crypto';

export { getPlatformMailConfig, isPlatformMailConfigured } from './platform-config';
export { bustMailConfigCache, clearMailConfigCache, resolveMailConfig } from './resolve-config';
export { clearTransporterCache, evictTransporter, getTransporter, verifyTransport } from './transporter';
export { deliver, formatAddress, type DeliverResult } from './deliver';
export { MailTimeoutError, redactMailError, safeErrorSummary, toSafeSmtpError } from './smtp-errors';
