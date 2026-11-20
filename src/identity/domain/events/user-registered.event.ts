import { randomUUID } from 'node:crypto';
import { DomainEvent } from '../../../shared/domain/domain-event';

export class UserRegistered implements DomainEvent {
  readonly eventId = randomUUID();

  constructor(
    readonly userId: string,
    readonly email: string,
    readonly occurredAt: Date,
  ) {}
}
