/**
 * A minimal SMTP server that accepts one conversation and records what it received.
 *
 * Exists so the transport can be proven against a real socket rather than a mocked
 * nodemailer. A mock would happily "pass" while the From header, the multipart body, or
 * the AUTH exchange were wrong, which are exactly the things that break in production.
 *
 * Speaks only the subset nodemailer uses: EHLO, AUTH PLAIN/LOGIN, MAIL FROM, RCPT TO,
 * DATA, QUIT. No TLS, which is why lib/email/transport/transporter.ts exempts loopback
 * hosts from requireTLS outside production.
 */

import { createServer, type Server, type Socket } from 'net';

export interface CapturedMessage {
  readonly mailFrom: string;
  readonly rcptTo: readonly string[];
  readonly data: string;
  readonly authenticated: boolean;
}

export interface SmtpSink {
  readonly port: number;
  readonly messages: readonly CapturedMessage[];
  close(): Promise<void>;
}

const CRLF = '\r\n';

export async function startSmtpSink(): Promise<SmtpSink> {
  const messages: CapturedMessage[] = [];

  const server: Server = createServer((socket: Socket) => {
    let buffer = '';
    let inData = false;
    let dataLines: string[] = [];
    let mailFrom = '';
    let rcptTo: string[] = [];
    let authenticated = false;
    let awaitingAuthUser = false;
    let awaitingAuthPass = false;

    const write = (line: string): void => {
      socket.write(`${line}${CRLF}`);
    };

    write('220 sink.test ESMTP ready');

    socket.on('data', (chunk: Buffer) => {
      buffer += chunk.toString('utf8');

      let newlineIndex = buffer.indexOf(CRLF);
      while (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + CRLF.length);

        handleLine(line);

        newlineIndex = buffer.indexOf(CRLF);
      }
    });

    function handleLine(line: string): void {
      if (inData) {
        if (line === '.') {
          inData = false;
          messages.push({ mailFrom, rcptTo: [...rcptTo], data: dataLines.join('\n'), authenticated });
          dataLines = [];
          rcptTo = [];
          write('250 2.0.0 Ok: queued as SINK1');
          return;
        }

        // RFC 5321 transparency: a leading dot is doubled on the wire.
        dataLines.push(line.startsWith('..') ? line.slice(1) : line);
        return;
      }

      if (awaitingAuthUser) {
        awaitingAuthUser = false;
        awaitingAuthPass = true;
        write('334 UGFzc3dvcmQ6');
        return;
      }

      if (awaitingAuthPass) {
        awaitingAuthPass = false;
        authenticated = true;
        write('235 2.7.0 Authentication successful');
        return;
      }

      const upper = line.toUpperCase();

      if (upper.startsWith('EHLO') || upper.startsWith('HELO')) {
        write('250-sink.test');
        write('250-AUTH PLAIN LOGIN');
        write('250-8BITMIME');
        write('250 SMTPUTF8');
        return;
      }

      if (upper.startsWith('AUTH LOGIN')) {
        awaitingAuthUser = true;
        write('334 VXNlcm5hbWU6');
        return;
      }

      if (upper.startsWith('AUTH PLAIN')) {
        // Credentials may ride along on the same line, or arrive in a continuation.
        if (line.trim().length > 'AUTH PLAIN'.length) {
          authenticated = true;
          write('235 2.7.0 Authentication successful');
        } else {
          awaitingAuthPass = true;
          write('334 ');
        }
        return;
      }

      if (upper.startsWith('MAIL FROM')) {
        mailFrom = line.slice(line.indexOf(':') + 1).trim();
        write('250 2.1.0 Ok');
        return;
      }

      if (upper.startsWith('RCPT TO')) {
        rcptTo.push(line.slice(line.indexOf(':') + 1).trim());
        write('250 2.1.5 Ok');
        return;
      }

      if (upper.startsWith('DATA')) {
        inData = true;
        write('354 End data with <CR><LF>.<CR><LF>');
        return;
      }

      if (upper.startsWith('QUIT')) {
        write('221 2.0.0 Bye');
        socket.end();
        return;
      }

      if (upper.startsWith('RSET') || upper.startsWith('NOOP')) {
        write('250 2.0.0 Ok');
        return;
      }

      write('502 5.5.2 Command not implemented');
    }

    socket.on('error', () => {
      // A client hanging up mid-conversation is not interesting here.
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('SMTP sink failed to bind a port');
  }

  let closed = false;

  return {
    port: address.port,
    messages,
    // Idempotent: a test that closes the sink to simulate an unreachable server would
    // otherwise blow up in its own afterEach.
    close: () =>
      new Promise<void>((resolve, reject) => {
        if (closed) {
          resolve();
          return;
        }

        closed = true;
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}
