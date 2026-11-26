import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes } from 'node:crypto';
import {
  GeneratedRefreshToken,
  ParsedRefreshToken,
  RefreshTokenCodec,
} from '../../domain/ports/refresh-token-codec.port';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** 32 random bytes in base64url, no padding. */
const SECRET_RE = /^[A-Za-z0-9_-]{43}$/;
const MAX_TOKEN_LENGTH = 100;

/**
 * Refresh token = `<sessionId>.<256-bit random secret>`.
 *
 * Stored as HMAC-SHA256(pepper, token). Why HMAC and not argon2: the secret
 * already has 256 bits of entropy, so a slow hash adds nothing; the pepper
 * (kept in env, not in the DB) means a leaked database alone cannot even be
 * used to check a guessed token.
 */
@Injectable()
export class HmacRefreshTokenCodec implements RefreshTokenCodec {
  private readonly pepper: Buffer;

  constructor(config: ConfigService) {
    const pepper = config.getOrThrow<string>('REFRESH_TOKEN_PEPPER');
    if (pepper.length < 32) {
      throw new Error('REFRESH_TOKEN_PEPPER must be at least 32 characters');
    }
    this.pepper = Buffer.from(pepper, 'utf8');
  }

  generate(sessionId: string): GeneratedRefreshToken {
    const secret = randomBytes(32).toString('base64url');
    return {
      token: `${sessionId}.${secret}`,
      hash: this.hash(sessionId, secret),
    };
  }

  parse(raw: unknown): ParsedRefreshToken | null {
    if (typeof raw !== 'string' || raw.length > MAX_TOKEN_LENGTH) return null;

    const parts = raw.split('.');
    if (parts.length !== 2) return null;
    const [sessionId, secret] = parts;
    if (!UUID_RE.test(sessionId) || !SECRET_RE.test(secret)) return null;

    return {
      sessionId: sessionId.toLowerCase(),
      hash: this.hash(sessionId, secret),
    };
  }

  /** The session id is part of the MAC input, so a secret can't be moved to another session. */
  private hash(sessionId: string, secret: string): string {
    return createHmac('sha256', this.pepper)
      .update(`${sessionId.toLowerCase()}.${secret}`)
      .digest('hex');
  }
}
