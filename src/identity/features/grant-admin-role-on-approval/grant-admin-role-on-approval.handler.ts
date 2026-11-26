import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { AdminAccessApproved } from '../../domain/events/admin-access-approved.event';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../domain/ports/user.repository';
import { withRetry } from '../../../shared/infra/messaging/with-retry';

/**
 * Second half of "approve": the User aggregate, in its own transaction.
 * Idempotent (grantAdminRole on an ADMIN changes nothing), because the
 * outbox may deliver the same event twice.
 */
@EventsHandler(AdminAccessApproved)
export class GrantAdminRoleOnApprovalHandler implements IEventHandler<AdminAccessApproved> {
  private readonly logger = new Logger(GrantAdminRoleOnApprovalHandler.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async handle(event: AdminAccessApproved): Promise<void> {
    try {
      await withRetry(async () => {
        const user = await this.users.findById(event.userId);
        if (!user) return; // deleted meanwhile: nothing to grant
        user.grantAdminRole(new Date());
        await this.users.save(user);
      });
    } catch (err) {
      this.logger.error(
        `Approved request ${event.requestId} but could not make user ${event.userId} an admin. ` +
          `This handler is idempotent: replay it with ` +
          `UPDATE identity.outbox SET published_at = NULL WHERE id = '${event.eventId}'`,
        err,
      );
    }
  }
}
