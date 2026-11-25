import { randomUUID } from 'node:crypto';
import { DomainEvent } from '../../../shared/domain/domain-event';

/** The requester withdrew their own pending request. */
export class AdminAccessRequestCancelled implements DomainEvent {
  readonly eventId = randomUUID();

  constructor(
    readonly requestId: string,
    readonly userId: string,
    readonly occurredAt: Date,
  ) {}
}
