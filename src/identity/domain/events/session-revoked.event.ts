import { randomUUID } from 'node:crypto';
import { DomainEvent } from '../../../shared/domain/domain-event';
import { SessionRevocationReason } from '../session/session-revocation-reason.enum';

export class SessionRevoked implements DomainEvent {
  readonly eventId = randomUUID();

  constructor(
    readonly sessionId: string,
    readonly userId: string,
    readonly reason: SessionRevocationReason,
    readonly occurredAt: Date,
  ) {}
}
