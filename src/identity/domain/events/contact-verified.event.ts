import { randomUUID } from 'node:crypto';
import { DomainEvent } from '../../../shared/domain/domain-event';
import { ContactChannel } from '../verification/verification-channel.enum';

/** The user proved they own their email address or phone number. */
export class ContactVerified implements DomainEvent {
  readonly eventId = randomUUID();

  constructor(
    readonly userId: string,
    readonly channel: ContactChannel,
    readonly occurredAt: Date,
  ) {}
}
