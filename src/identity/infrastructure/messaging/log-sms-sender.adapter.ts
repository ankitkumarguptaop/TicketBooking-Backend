import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsMessage, SmsSender } from '../../application/ports/sms-sender.port';

/**
 * Dev-only stand-in for an SMS provider: writes the message to the log.
 * Swap it for a real adapter (Twilio, MSG91, ...) by binding SMS_SENDER
 * to another class in identity.module.ts; nothing else changes.
 *
 * Refuses to start in production, where logging codes would let anyone
 * with log access verify any phone number.
 */
@Injectable()
export class LogSmsSender implements SmsSender {
  private readonly logger = new Logger('SMS');

  constructor(config: ConfigService) {
    if (config.get<string>('NODE_ENV') === 'production') {
      throw new Error(
        'LogSmsSender must not be used in production. Bind SMS_SENDER to a real provider.',
      );
    }
  }

  send(message: SmsMessage): Promise<void> {
    this.logger.warn(`to ${message.to}: ${message.text}`);
    return Promise.resolve();
  }
}
