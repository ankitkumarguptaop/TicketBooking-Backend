import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  AUTH_SESSION_REPOSITORY,
  AuthSessionRepository,
} from '../../../domain/session/auth-session.repository';
import { SessionRevocationReason } from '../../../domain/session/session-revocation-reason.enum';
import { LogoutAllSessionsCommand } from './logout-all-sessions.command';

/** "Log out everywhere": revokes every active session of the user. */
@CommandHandler(LogoutAllSessionsCommand)
export class LogoutAllSessionsHandler implements ICommandHandler<
  LogoutAllSessionsCommand,
  { revoked: number }
> {
  constructor(
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly sessions: AuthSessionRepository,
  ) {}

  async execute(
    command: LogoutAllSessionsCommand,
  ): Promise<{ revoked: number }> {
    const now = new Date();
    const active = await this.sessions.findActiveByUserId(command.userId, now);

    // One aggregate per save. A user has a handful of sessions at most.
    for (const session of active) {
      session.revoke(SessionRevocationReason.LOGOUT_ALL, now);
      await this.sessions.save(session);
    }
    return { revoked: active.length };
  }
}
