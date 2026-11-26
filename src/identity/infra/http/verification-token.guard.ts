import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import {
  VERIFICATION_TOKEN_SERVICE,
  VerificationTokenService,
} from '../../domain/ports/verification-token.port';
import { AuthCookies } from './auth-cookies';

export type RequestWithVerifyingUser = Request & { verifyingUserId?: string };

/**
 * Lets a request through only with a valid verification cookie (set by
 * register, or by a correct-password login on an unverified account).
 * Not a session: these routes can verify contacts and nothing more.
 */
@Injectable()
export class VerificationTokenGuard implements CanActivate {
  constructor(
    @Inject(VERIFICATION_TOKEN_SERVICE)
    private readonly tokens: VerificationTokenService,
    private readonly cookies: AuthCookies,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithVerifyingUser>();
    const userId = await this.tokens.verify(
      this.cookies.readVerificationToken(request),
    );
    if (!userId) {
      // One code for missing, forged and expired: the client's answer is
      // the same every time ("sign in again to get a new link").
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'AUTH_VERIFICATION_EXPIRED',
        message: 'Your verification link expired. Sign in to continue',
      });
    }
    request.verifyingUserId = userId;
    return true;
  }
}
