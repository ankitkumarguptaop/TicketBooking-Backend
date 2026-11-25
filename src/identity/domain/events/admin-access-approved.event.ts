import { randomUUID } from 'node:crypto';
import { DomainEvent } from '../../../shared/domain/domain-event';

/**
 * A SUPER_ADMIN approved the request. The User aggregate is changed by a
 * handler of this event, not in the same transaction (one aggregate per
 * transaction), so the role is granted a moment later.
 */
export class AdminAccessApproved implements DomainEvent {
  readonly eventId = randomUUID();

  constructor(
    readonly requestId: string,
    readonly userId: string,
    readonly decidedBy: string,
    readonly occurredAt: Date,
  ) {}
}
