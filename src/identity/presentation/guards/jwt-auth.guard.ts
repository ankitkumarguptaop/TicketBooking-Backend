import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { Request } from 'express';
import {
  AUTH_SESSION_REPOSITORY,
  AuthSessionRepository,
} from '../../domain/session/auth-session.repository';
import { ACCESS_TOKEN_COOKIE } from '../cookies/auth-cookies';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * Verifies the access token (httpOnly cookie, or Bearer header for
 * non-browser clients) and attaches its claims to request.user.
 *
 * Algorithm, issuer and audience are pinned in JwtModule's verifyOptions,
 * so `alg: none` or a token minted for another audience is rejected.
 * An expired token gets code AUTH_TOKEN_EXPIRED: the client's cue to call
 * POST /auth/refresh once and retry.
 *
 * The JWT alone can't tell that its session was signed out from another
 * device, so the session (`sid`) is also looked up on every request. A
 * revoked or expired session gets AUTH_SESSION_REVOKED: the client's
 * refresh then fails too, the cookies are cleared and the device is out
 * at once instead of when the access token expires (up to 15 min later).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly sessions: AuthSessionRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();

    const token = this.extractToken(request);
    if (!token) {
      throw this.unauthorized('AUTH_TOKEN_MISSING', 'Missing access token');
    }

    let claims: AuthenticatedUser;
    try {
      claims = await this.jwt.verifyAsync<AuthenticatedUser>(token);
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw this.unauthorized('AUTH_TOKEN_EXPIRED', 'Access token expired');
      }
      throw this.unauthorized('AUTH_TOKEN_INVALID', 'Invalid access token');
    }

    if (!claims.sub || !claims.sid || !claims.role) {
      throw this.unauthorized('AUTH_TOKEN_INVALID', 'Invalid access token');
    }

    // One primary-key lookup per request.
    const session = await this.sessions.findById(claims.sid);
    if (
      !session ||
      session.userId !== claims.sub ||
      !session.isActive(new Date())
    ) {
      throw this.unauthorized('AUTH_SESSION_REVOKED', 'Session has ended');
    }

    request.user = {
      sub: claims.sub,
      email: claims.email,
      role: claims.role,
      sid: claims.sid,
    };
    return true;
  }

  private extractToken(request: Request): string | null {
    const fromCookie = (
      request.cookies as Record<string, unknown> | undefined
    )?.[ACCESS_TOKEN_COOKIE];
    if (typeof fromCookie === 'string' && fromCookie) return fromCookie;

    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    return scheme === 'Bearer' && token ? token : null;
  }

  private unauthorized(code: string, message: string): UnauthorizedException {
    return new UnauthorizedException({ statusCode: 401, code, message });
  }
}
