import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import {
  EmailMessage,
  EmailSender,
} from '../../application/ports/email-sender.port';

const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 300;
const TIMEOUT_MS = 10_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sends email over SMTP. In dev that's Mailpit (docker-compose), which
 * catches everything and shows it at http://localhost:8025.
 *
 * Every network call has a timeout and is retried with exponential backoff
 * (300 ms, 600 ms), so a mail server hiccup doesn't fail the request.
 */
@Injectable()
export class NodemailerEmailSender implements EmailSender {
  private readonly logger = new Logger(NodemailerEmailSender.name);
  private readonly transport: Transporter;
  private readonly from: string;

  constructor(config: ConfigService) {
    const user = config.get<string>('SMTP_USER');
    this.from = config.get<string>(
      'MAIL_FROM',
      'Balcony <no-reply@balcony.local>',
    );
    this.transport = createTransport({
      host: config.get<string>('SMTP_HOST', 'localhost'),
      port: Number(config.get('SMTP_PORT', 1025)),
      // true = TLS from the start (port 465). false = plain or STARTTLS.
      secure: config.get<string>('SMTP_SECURE') === 'true',
      auth: user
        ? { user, pass: config.getOrThrow<string>('SMTP_PASSWORD') }
        : undefined,
      connectionTimeout: TIMEOUT_MS,
      greetingTimeout: TIMEOUT_MS,
      socketTimeout: TIMEOUT_MS,
    });
  }

  async send(message: EmailMessage): Promise<void> {
    for (let attempt = 1; ; attempt++) {
      try {
        await this.transport.sendMail({ from: this.from, ...message });
        return;
      } catch (err) {
        if (attempt >= MAX_ATTEMPTS) throw err;
        this.logger.warn(
          `Email send failed (attempt ${attempt}/${MAX_ATTEMPTS}), retrying`,
        );
        await sleep(BASE_BACKOFF_MS * 2 ** (attempt - 1));
      }
    }
  }
}
