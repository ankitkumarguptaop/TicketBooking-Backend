import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { AdminRoleRevoked } from '../../domain/events/admin-role-revoked.event';
import {
  AUTH_SESSION_REPOSITORY,
  AuthSessionRepository,
} from '../../domain/ports/auth-session.repository';
import { SessionRevocationReason } from '../../domain/session/session-revocation-reason.enum';
import { withRetry } from '../../../shared/infra/messaging/with-retry';

/**
 * A demoted admin's access tokens still say ADMIN for up to 15 minutes.
 * Ending every session makes JwtAuthGuard reject them at once (it checks
 * the session on each request) and their devices get `session-revoked`.
 * Idempotent: revoking a revoked session changes nothing.
 */
@EventsHandler(AdminRoleRevoked)
export class EndSessionsOnAdminRoleRevokedHandler implements IEventHandler<AdminRoleRevoked> {
  private readonly logger = new Logger(
    EndSessionsOnAdminRoleRevokedHandler.name,
  );

  constructor(
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly sessions: AuthSessionRepository,
  ) {}

  async handle(event: AdminRoleRevoked): Promise<void> {
    try {
      await withRetry(async () => {
        const now = new Date();
        for (const session of await this.sessions.findActiveByUserId(
          event.userId,
          now,
        )) {
          session.revoke(SessionRevocationReason.ROLE_CHANGED, now);
          await this.sessions.save(session);
        }
      });
    } catch (err) {
      this.logger.error(
        `Could not end sessions of demoted user ${event.userId}; their admin token may live up to 15 min. ` +
          `Replay with UPDATE identity.outbox SET published_at = NULL WHERE id = '${event.eventId}'`,
        err,
      );
    }
  }
}
