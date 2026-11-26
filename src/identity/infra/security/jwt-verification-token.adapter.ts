import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  IssuedVerificationToken,
  VerificationTokenService,
} from '../../domain/ports/verification-token.port';

const TTL_SECONDS = 30 * 60;
const PURPOSE = 'verify-contact';

interface VerificationClaims {
  sub: string;
  purpose: string;
}

/**
 * A JWT with the same key as access tokens but a DIFFERENT audience
 * ("<aud>:verification"). The access-token guard pins the normal audience,
 * so this token can never be used as a session, and vice versa.
 */
@Injectable()
export class JwtVerificationTokenService implements VerificationTokenService {
  private readonly audience: string;

  constructor(
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.audience = `${config.get<string>('JWT_AUDIENCE', 'ticket-booking')}:verification`;
  }

  async issue(userId: string): Promise<IssuedVerificationToken> {
    const claims: VerificationClaims = { sub: userId, purpose: PURPOSE };
    const token = await this.jwt.signAsync(claims, {
      audience: this.audience,
      expiresIn: TTL_SECONDS,
    });
    return { token, expiresAt: new Date(Date.now() + TTL_SECONDS * 1000) };
  }

  async verify(token: unknown): Promise<string | null> {
    if (typeof token !== 'string' || !token) return null;
    try {
      const claims = await this.jwt.verifyAsync<VerificationClaims>(token, {
        audience: this.audience,
      });
      return claims.purpose === PURPOSE && claims.sub ? claims.sub : null;
    } catch {
      return null;
    }
  }
}
