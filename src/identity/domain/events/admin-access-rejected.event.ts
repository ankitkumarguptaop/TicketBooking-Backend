import { randomUUID } from 'node:crypto';
import { DomainEvent } from '../../../shared/domain/domain-event';

export class AdminAccessRejected implements DomainEvent {
  readonly eventId = randomUUID();

  constructor(
    readonly requestId: string,
    readonly userId: string,
    readonly decidedBy: string,
    readonly occurredAt: Date,
  ) {}
}
