import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomInt } from 'node:crypto';
import { GeneratedOtp, OtpCodec } from '../../domain/ports/otp-codec.port';

const CODE_LENGTH = 6;

/**
 * 6-digit codes from a cryptographic RNG, stored as HMAC-SHA256(pepper, scope:code).
 *
 * Why the pepper matters MORE here than for refresh tokens: a 6-digit code
 * has only 1,000,000 values. A plain SHA-256 of it could be reversed by
 * trying them all in milliseconds. With a secret key that isn't in the
 * database, a leaked table alone reveals nothing.
 */
@Injectable()
export class HmacOtpCodec implements OtpCodec {
  private readonly pepper: Buffer;

  constructor(config: ConfigService) {
    const pepper = config.getOrThrow<string>('VERIFICATION_CODE_PEPPER');
    if (pepper.length < 32) {
      throw new Error(
        'VERIFICATION_CODE_PEPPER must be at least 32 characters',
      );
    }
    this.pepper = Buffer.from(pepper, 'utf8');
  }

  generate(scope: string): GeneratedOtp {
    // randomInt is uniform (no modulo bias), unlike Math.random() * 1e6.
    const code = randomInt(0, 10 ** CODE_LENGTH)
      .toString()
      .padStart(CODE_LENGTH, '0');
    return { code, hash: this.hash(scope, code) };
  }

  hash(scope: string, code: string): string {
    return createHmac('sha256', this.pepper)
      .update(`${scope}:${code}`)
      .digest('hex');
  }
}
