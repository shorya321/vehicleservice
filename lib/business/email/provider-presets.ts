/**
 * Provider presets for the business email settings form.
 *
 * These only prefill the form and swap the help text. Whatever a business picks, the
 * stored configuration is plain SMTP and the transport is the same, so adding a provider
 * here never touches the sender.
 *
 * Pure data with no JSX, so the API route and the tests can import it too.
 */

export const EMAIL_PROVIDER_PRESETS = [
  'custom',
  'resend',
  'gmail',
  'ses',
  'mailgun',
  'postmark',
  'sendgrid',
] as const;

export type EmailProviderPreset = (typeof EMAIL_PROVIDER_PRESETS)[number];

export interface ProviderPreset {
  readonly id: EmailProviderPreset;
  readonly label: string;
  readonly host: string;
  readonly port: number;
  readonly secure: boolean;
  /** Fixed by the provider, so the form can lock the field. */
  readonly fixedUsername?: string;
  readonly usernameHint: string;
  readonly passwordHint: string;
  /** Where the owner goes to verify their sending domain. */
  readonly verifyUrl?: string;
  readonly verifyLabel?: string;
  /** SPF include for the DNS checklist. */
  readonly spfInclude?: string;
  /** True when the provider signs on your behalf and DNS setup does not apply. */
  readonly managedDomain?: boolean;
}

export const PROVIDER_PRESETS: Record<EmailProviderPreset, ProviderPreset> = {
  resend: {
    id: 'resend',
    label: 'Resend',
    host: 'smtp.resend.com',
    port: 587,
    secure: false,
    fixedUsername: 'resend',
    usernameHint: 'Always the literal word "resend".',
    passwordHint: 'Your Resend API key, the value beginning re_.',
    verifyUrl: 'https://resend.com/domains',
    verifyLabel: 'Resend domains',
    spfInclude: 'amazonses.com',
  },
  gmail: {
    id: 'gmail',
    label: 'Gmail / Google Workspace',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    usernameHint: 'Your full Google address, for example bookings@yourcompany.com.',
    passwordHint: 'A 16-character App Password, not your normal login password.',
    // The App Passwords screen, which is where the credential comes from. It is not a
    // domain-verification screen, and the checklist knows not to call it one: managedDomain
    // suppresses the "verify your domain" step for Google, who sign outbound mail
    // themselves once the Workspace domain is set up.
    verifyUrl: 'https://myaccount.google.com/apppasswords',
    verifyLabel: 'Google App Passwords',
    managedDomain: true,
  },
  ses: {
    id: 'ses',
    label: 'Amazon SES',
    host: 'email-smtp.us-east-1.amazonaws.com',
    port: 587,
    secure: false,
    usernameHint: 'Your SES SMTP username, which is not your AWS access key id.',
    passwordHint: 'The SES SMTP password generated alongside that username.',
    verifyUrl: 'https://console.aws.amazon.com/ses/home#/verified-identities',
    verifyLabel: 'SES verified identities',
    spfInclude: 'amazonses.com',
  },
  mailgun: {
    id: 'mailgun',
    label: 'Mailgun',
    host: 'smtp.mailgun.org',
    port: 587,
    secure: false,
    usernameHint: 'Usually postmaster@mg.yourdomain.com.',
    passwordHint: 'The SMTP password from your Mailgun sending domain.',
    verifyUrl: 'https://app.mailgun.com/mg/sending/domains',
    verifyLabel: 'Mailgun sending domains',
    spfInclude: 'mailgun.org',
  },
  postmark: {
    id: 'postmark',
    label: 'Postmark',
    host: 'smtp.postmarkapp.com',
    port: 587,
    secure: false,
    usernameHint: 'Your Server API token.',
    passwordHint: 'The same Server API token again.',
    verifyUrl: 'https://account.postmarkapp.com/signatures',
    verifyLabel: 'Postmark sender signatures',
    spfInclude: 'spf.mtasv.net',
  },
  sendgrid: {
    id: 'sendgrid',
    label: 'SendGrid',
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    fixedUsername: 'apikey',
    usernameHint: 'Always the literal word "apikey".',
    passwordHint: 'Your SendGrid API key.',
    verifyUrl: 'https://app.sendgrid.com/settings/sender_auth',
    verifyLabel: 'SendGrid sender authentication',
    spfInclude: 'sendgrid.net',
  },
  custom: {
    id: 'custom',
    label: 'Custom SMTP server',
    host: '',
    port: 587,
    secure: false,
    usernameHint: 'Whatever your mail provider issued for SMTP.',
    passwordHint: 'The matching SMTP password.',
  },
};

/** AWS regions offered for the SES preset, which drives the host. */
export const SES_REGIONS = [
  'us-east-1',
  'us-east-2',
  'us-west-2',
  'eu-west-1',
  'eu-central-1',
  'me-south-1',
  'me-central-1',
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
] as const;

export function sesHostForRegion(region: string): string {
  return `email-smtp.${region}.amazonaws.com`;
}

/**
 * Ports where TLS is implicit from the first byte, rather than negotiated with STARTTLS.
 * Getting this pairing wrong is the single most common SMTP misconfiguration, so the
 * form derives it and the schema rejects the contradiction.
 */
export function secureForPort(port: number): boolean {
  return port === 465;
}
