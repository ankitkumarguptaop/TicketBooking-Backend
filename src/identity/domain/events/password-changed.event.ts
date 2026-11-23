import { randomUUID } from 'node:crypto';
import { DomainEvent } from '../../../shared/domain/domain-event';

/** The user's password was replaced (today only via "forgot password"). */
export class PasswordChanged implements DomainEvent {
  readonly eventId = randomUUID();

  constructor(
    readonly userId: string,
    readonly occurredAt: Date,
  ) {}
}
