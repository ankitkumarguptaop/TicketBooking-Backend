import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionNotFoundError } from '../../domain/errors/identity.errors';
import {
  AUTH_SESSION_REPOSITORY,
  AuthSessionRepository,
} from '../../domain/ports/auth-session.repository';
import { SessionRevocationReason } from '../../domain/session/session-revocation-reason.enum';
import { RevokeSessionCommand } from './revoke-session.command';

/** "Sign out that iPhone" from the session list. */
@CommandHandler(RevokeSessionCommand)
export class RevokeSessionHandler implements ICommandHandler<
  RevokeSessionCommand,
  void
> {
  constructor(
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly sessions: AuthSessionRepository,
  ) {}

  async execute(command: RevokeSessionCommand): Promise<void> {
    const session = await this.sessions.findById(command.sessionId);

    // Someone else's session gets the same 404 as a missing one.
    if (!session || !session.belongsTo(command.userId)) {
      throw new SessionNotFoundError(command.sessionId);
    }

    session.revoke(SessionRevocationReason.REVOKED_BY_USER, new Date());
    await this.sessions.save(session);
  }
}
