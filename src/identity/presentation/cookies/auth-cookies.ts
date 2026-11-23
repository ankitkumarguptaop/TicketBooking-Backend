import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Request, Response } from 'express';
import { AuthTokens } from '../../application/commands/auth-tokens';
import { IssuedVerificationToken } from '../../application/ports/verification-token.port';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
/**
 * The refresh cookie is only sent to /auth/* (refresh + logout), never on
 * ordinary API calls, so it can't leak from them or be logged by them.
 */
const REFRESH_COOKIE_PATH = '/auth';
export const VERIFICATION_TOKEN_COOKIE = 'verification_token';
/** Only the sign-up verification endpoints ever receive this cookie. */
const VERIFICATION_COOKIE_PATH = '/auth/verification';

/** The only place that knows cookie names and flags. */
@Injectable()
export class AuthCookies {
  private readonly secure: boolean;
  private readonly domain: string | undefined;

  constructor(config: ConfigService) {
    // Secure by default; only an explicit COOKIE_SECURE=false (local http) turns it off.
    this.secure = config.get<string>('COOKIE_SECURE') !== 'false';
    this.domain = config.get<string>('COOKIE_DOMAIN') || undefined;
  }

  set(res: Response, tokens: AuthTokens, now = new Date()): void {
    // The access COOKIE outlives the access TOKEN on purpose: the JWT's own
    // `exp` enforces the 15 minutes. If the cookie vanished at the same
    // moment, the browser would send nothing and the API could only answer
    // AUTH_TOKEN_MISSING instead of AUTH_TOKEN_EXPIRED ("go refresh").
    res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
      ...this.accessOptions(),
      maxAge: Math.max(
        0,
        tokens.refreshTokenExpiresAt.getTime() - now.getTime(),
      ),
    });
    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      ...this.refreshOptions(),
      maxAge: Math.max(
        0,
        tokens.refreshTokenExpiresAt.getTime() - now.getTime(),
      ),
    });
  }

  clear(res: Response): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE, this.accessOptions());
    res.clearCookie(REFRESH_TOKEN_COOKIE, this.refreshOptions());
  }

  /** The short-lived pass for verifying contacts before the first sign-in. */
  setVerification(
    res: Response,
    issued: IssuedVerificationToken,
    now = new Date(),
  ): void {
    res.cookie(VERIFICATION_TOKEN_COOKIE, issued.token, {
      ...this.verificationOptions(),
      maxAge: Math.max(0, issued.expiresAt.getTime() - now.getTime()),
    });
  }

  clearVerification(res: Response): void {
    res.clearCookie(VERIFICATION_TOKEN_COOKIE, this.verificationOptions());
  }

  readVerificationToken(req: Request): unknown {
    return (req.cookies as Record<string, unknown> | undefined)?.[
      VERIFICATION_TOKEN_COOKIE
    ];
  }

  readRefreshToken(req: Request): unknown {
    return (req.cookies as Record<string, unknown> | undefined)?.[
      REFRESH_TOKEN_COOKIE
    ];
  }

  private accessOptions(): CookieOptions {
    return {
      httpOnly: true, // JS (and therefore XSS) can't read it
      secure: this.secure,
      sameSite: 'lax', // not sent on cross-site POST/PUT/DELETE -> CSRF-safe for mutations
      path: '/',
      domain: this.domain,
    };
  }

  private verificationOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.secure,
      sameSite: 'strict',
      path: VERIFICATION_COOKIE_PATH,
      domain: this.domain,
    };
  }

  private refreshOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.secure,
      sameSite: 'strict', // never sent from another site, not even on links
      path: REFRESH_COOKIE_PATH,
      domain: this.domain,
    };
  }
}
