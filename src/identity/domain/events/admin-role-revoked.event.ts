import { randomUUID } from 'node:crypto';
import { DomainEvent } from '../../../shared/domain/domain-event';

/**
 * The user is back to USER. A handler revokes their sessions, because an
 * access token issued while they were ADMIN still says ADMIN.
 */
export class AdminRoleRevoked implements DomainEvent {
  readonly eventId = randomUUID();

  constructor(
    readonly userId: string,
    readonly revokedBy: string,
    readonly occurredAt: Date,
  ) {}
}
