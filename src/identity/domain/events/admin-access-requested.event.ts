import { randomUUID } from 'node:crypto';
import { DomainEvent } from '../../../shared/domain/domain-event';

/** A user asked to become an ADMIN; a SUPER_ADMIN must decide. */
export class AdminAccessRequested implements DomainEvent {
  readonly eventId = randomUUID();

  constructor(
    readonly requestId: string,
    readonly userId: string,
    readonly occurredAt: Date,
  ) {}
}
