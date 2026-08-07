/**
 * The one place a message is physically handed to an SMTP server.
 */

import { getTransporter } from './transporter';
import { MailTimeoutError } from './smtp-errors';
import type { MailProvider, ResolvedMailConfig } from './types';

/**
 * Outer deadline for a single send.
 *
 * nodemailer's socketTimeout covers a socket that has gone quiet, not a server that
 * dribbles one byte every 19 seconds. This is the actual bound on how long a route can
 * be held hostage by a tenant-controlled mail server.
 */
const SEND_DEADLINE_MS = 25_000;

export interface DeliverParams {
  readonly config: ResolvedMailConfig;
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly text: string;
  readonly replyTo?: string;
}

export interface DeliverResult {
  readonly messageId: string;
  readonly provider: MailProvider;
  readonly durationMs: number;
  readonly response: string;
}

/** Builds an RFC 5322 From header, quoting the display name when it needs it. */
export function formatAddress(name: string, email: string): string {
  if (!name) return email;

  const needsQuoting = /[",<>@]/.test(name);
  const display = needsQuoting ? `"${name.replace(/"/g, '\\"')}"` : name;

  return `${display} <${email}>`;
}

export async function deliver(params: DeliverParams): Promise<DeliverResult> {
  const { config } = params;
  const startedAt = Date.now();

  const transporter = getTransporter(config);

  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(
      () => reject(new MailTimeoutError(`Sending via ${config.smtp.host} exceeded ${SEND_DEADLINE_MS}ms`)),
      SEND_DEADLINE_MS
    );
  });

  try {
    const info = await Promise.race([
      transporter.sendMail({
        from: formatAddress(config.identity.fromName, config.identity.fromEmail),
        to: params.to,
        replyTo: params.replyTo ?? config.identity.replyTo ?? undefined,
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
      deadline,
    ]);

    return {
      messageId: info.messageId ?? '',
      provider: config.provider,
      durationMs: Date.now() - startedAt,
      response: typeof info.response === 'string' ? info.response : '',
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
