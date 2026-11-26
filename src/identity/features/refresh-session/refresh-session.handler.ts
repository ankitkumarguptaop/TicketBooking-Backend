import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ConcurrentSessionUpdateError,
  InvalidRefreshTokenError,
  RefreshTokenReuseDetectedError,
} from '../../domain/errors/identity.errors';
import { AuthSession } from '../../domain/session/auth-session.aggregate';
import {
  AUTH_SESSION_REPOSITORY,
  AuthSessionRepository,
} from '../../domain/ports/auth-session.repository';
import { SessionLifetime } from '../../domain/session/session-lifetime.vo';
import { SessionRevocationReason } from '../../domain/session/session-revocation-reason.enum';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../domain/ports/user.repository';
import {
  ACCESS_TOKEN_ISSUER,
  AccessTokenIssuer,
} from '../../domain/ports/access-token-issuer.port';
import {
  REFRESH_TOKEN_CODEC,
  RefreshTokenCodec,
} from '../../domain/ports/refresh-token-codec.port';
import { SESSION_LIFETIME } from '../../domain/ports/session-lifetime.token';
import { AuthTokens } from '../../domain/ports/auth-tokens';
import { RefreshSessionCommand } from './refresh-session.command';

/**
 * Refresh-token rotation for ONE session:
 *   load session -> session.rotate(presented, next) -> save (optimistic lock)
 *   -> issue a fresh access token.
 */
@CommandHandler(RefreshSessionCommand)
export class RefreshSessionHandler implements ICommandHandler<
  RefreshSessionCommand,
  AuthTokens
> {
  constructor(
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly sessions: AuthSessionRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(ACCESS_TOKEN_ISSUER)
    private readonly accessTokens: AccessTokenIssuer,
    @Inject(REFRESH_TOKEN_CODEC)
    private readonly refreshTokens: RefreshTokenCodec,
    @Inject(SESSION_LIFETIME) private readonly lifetime: SessionLifetime,
  ) {}

  async execute(command: RefreshSessionCommand): Promise<AuthTokens> {
    const presented = this.refreshTokens.parse(command.refreshToken);
    if (!presented) throw new InvalidRefreshTokenError();

    const session = await this.sessions.findById(presented.sessionId);
    if (!session) throw new InvalidRefreshTokenError();

    const now = new Date();

    // Claims are rebuilt from the current user, so a role change or a
    // deleted account takes effect at the next refresh at the latest.
    const user = await this.users.findById(session.userId);
    if (!user) {
      session.revoke(SessionRevocationReason.USER_GONE, now);
      await this.persist(session);
      throw new InvalidRefreshTokenError();
    }

    const next = this.refreshTokens.generate(session.id);
    try {
      session.rotate({
        presentedTokenHash: presented.hash,
        nextTokenHash: next.hash,
        lifetime: this.lifetime,
        now,
      });
    } catch (err) {
      // The session revoked itself; make that durable before failing.
      if (err instanceof RefreshTokenReuseDetectedError) {
        await this.persist(session);
      }
      throw err;
    }

    try {
      await this.persist(session);
    } catch (err) {
      if (err instanceof ConcurrentSessionUpdateError) {
        // Another request rotated this same token a moment ago. Only one of
        // two holders of a single-use token can be legitimate, so treat it
        // like reuse and kill the session.
        await this.revokeForRace(session.id, now);
        throw new RefreshTokenReuseDetectedError();
      }
      throw err;
    }

    const access = await this.accessTokens.issue({
      sub: user.id,
      email: user.email.value,
      role: user.role,
      sid: session.id,
    });

    return {
      accessToken: access.token,
      accessTokenExpiresAt: access.expiresAt,
      refreshToken: next.token,
      refreshTokenExpiresAt: session.refreshTokenExpiresAt,
    };
  }

  /** Save = row + events in one transaction (outbox). */
  private async persist(session: AuthSession): Promise<void> {
    await this.sessions.save(session);
  }

  private async revokeForRace(sessionId: string, now: Date): Promise<void> {
    const fresh = await this.sessions.findById(sessionId);
    if (!fresh) return;
    fresh.markCompromised(now);
    await this.persist(fresh);
  }
}
