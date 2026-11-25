import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  AUTH_SESSION_REPOSITORY,
  AuthSessionRepository,
} from '../../../domain/session/auth-session.repository';
import {
  REFRESH_TOKEN_CODEC,
  RefreshTokenCodec,
} from '../../ports/refresh-token-codec.port';
import { LogoutCommand } from './logout.command';

/**
 * Ends the session on THIS device only. Idempotent and silent: an unknown
 * or malformed token is not an error, the cookies get cleared either way.
 */
@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand, void> {
  constructor(
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly sessions: AuthSessionRepository,
    @Inject(REFRESH_TOKEN_CODEC)
    private readonly refreshTokens: RefreshTokenCodec,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    const presented = this.refreshTokens.parse(command.refreshToken);
    if (!presented) return;

    const session = await this.sessions.findById(presented.sessionId);
    if (!session) return;

    session.logout(presented.hash, new Date());
    await this.sessions.save(session);
  }
}
