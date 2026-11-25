import { randomUUID } from 'node:crypto';
import { DomainEvent } from '../../../shared/domain/domain-event';

/** The user is now an ADMIN (from their next token refresh). */
export class AdminRoleGranted implements DomainEvent {
  readonly eventId = randomUUID();

  constructor(
    readonly userId: string,
    readonly occurredAt: Date,
  ) {}
}
