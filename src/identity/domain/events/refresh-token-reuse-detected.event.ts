import { randomUUID } from 'node:crypto';
import { DomainEvent } from '../../../shared/domain/domain-event';

/**
 * Security signal: an already-rotated refresh token was replayed, so either
 * the user or a thief holds a copy. Notification can warn the user on it.
 */
export class RefreshTokenReuseDetected implements DomainEvent {
  readonly eventId = randomUUID();

  constructor(
    readonly sessionId: string,
    readonly userId: string,
    readonly occurredAt: Date,
  ) {}
}
