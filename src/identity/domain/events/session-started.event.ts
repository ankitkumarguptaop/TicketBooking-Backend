import { randomUUID } from 'node:crypto';
import { DomainEvent } from '../../../shared/domain/domain-event';

export class SessionStarted implements DomainEvent {
  readonly eventId = randomUUID();

  constructor(
    readonly sessionId: string,
    readonly userId: string,
    readonly deviceName: string | null,
    readonly ipAddress: string | null,
    readonly occurredAt: Date,
  ) {}
}
