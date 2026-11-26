import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import {
  EmailNotVerifiedError,
  InvalidCredentialsError,
} from '../../domain/errors/identity.errors';
import { AuthSession } from '../../domain/session/auth-session.aggregate';
import {
  AUTH_SESSION_REPOSITORY,
  AuthSessionRepository,
} from '../../domain/ports/auth-session.repository';
import { SessionLifetime } from '../../domain/session/session-lifetime.vo';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../domain/ports/user.repository';
import { Email } from '../../domain/value-objects/email.vo';
import { VerificationChannel } from '../../domain/verification/verification-channel.enum';
import {
  ACCESS_TOKEN_ISSUER,
  AccessTokenIssuer,
} from '../../domain/ports/access-token-issuer.port';
import {
  PASSWORD_HASHER,
  PasswordHasher,
} from '../../domain/ports/password-hasher.port';
import {
  REFRESH_TOKEN_CODEC,
  RefreshTokenCodec,
} from '../../domain/ports/refresh-token-codec.port';
import {
  toUserProfileView,
  UserProfileView,
} from '../get-user-profile/user-profile.view';
import { SESSION_LIFETIME } from '../../domain/ports/session-lifetime.token';
import { AuthTokens } from '../../domain/ports/auth-tokens';
import { LoginUserCommand } from './login-user.command';

export interface LoginResult {
  user: UserProfileView;
  tokens: AuthTokens;
}

@CommandHandler(LoginUserCommand)
export class LoginUserHandler implements ICommandHandler<
  LoginUserCommand,
  LoginResult
> {
  /** Hash of a throwaway password, used to make "no such user" cost the same as "wrong password". */
  private dummyHash: Promise<string> | null = null;

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly sessions: AuthSessionRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(ACCESS_TOKEN_ISSUER)
    private readonly accessTokens: AccessTokenIssuer,
    @Inject(REFRESH_TOKEN_CODEC)
    private readonly refreshTokens: RefreshTokenCodec,
    @Inject(SESSION_LIFETIME) private readonly lifetime: SessionLifetime,
  ) {}

  async execute(command: LoginUserCommand): Promise<LoginResult> {
    const user = await this.users.findByEmail(Email.create(command.email));

    // Same error AND roughly the same time for unknown email and wrong
    // password, so neither the message nor the latency enumerates accounts.
    if (!user) {
      this.dummyHash ??= this.hasher.hash(randomUUID());
      await this.hasher.verify(await this.dummyHash, command.password);
      throw new InvalidCredentialsError();
    }
    if (!(await this.hasher.verify(user.passwordHash, command.password))) {
      throw new InvalidCredentialsError();
    }
    // Only verified emails get a session. Checked after the password, so a
    // stranger can't use this answer to find out which emails are registered.
    if (!user.isVerified(VerificationChannel.EMAIL)) {
      throw new EmailNotVerifiedError(user.id);
    }

    // Every login is a new, independent session (one per device).
    const now = new Date();
    const sessionId = randomUUID();
    const refresh = this.refreshTokens.generate(sessionId);
    const session = AuthSession.start({
      id: sessionId,
      userId: user.id,
      tokenHash: refresh.hash,
      device: command.device,
      lifetime: this.lifetime,
      now,
    });

    await this.sessions.save(session);

    const access = await this.accessTokens.issue({
      sub: user.id,
      email: user.email.value,
      role: user.role,
      sid: session.id,
    });

    return {
      user: toUserProfileView(user),
      tokens: {
        accessToken: access.token,
        accessTokenExpiresAt: access.expiresAt,
        refreshToken: refresh.token,
        refreshTokenExpiresAt: session.refreshTokenExpiresAt,
      },
    };
  }
}
