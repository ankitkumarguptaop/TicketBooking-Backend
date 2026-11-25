import { EntityManager } from 'typeorm';
import { DomainEvent } from '../../../shared/domain/domain-event';
import { eventTypeOf, serializeEvent } from './identity-event-registry';
import { OutboxMessageOrmEntity } from '../persistence/outbox-message.orm-entity';

/**
 * Appends events to identity.outbox using the CALLER's transaction
 * (`manager`), so they commit or roll back with the aggregate's own rows.
 */
export async function appendToOutbox(
  manager: EntityManager,
  events: DomainEvent[],
): Promise<void> {
  if (events.length === 0) return;
  await manager.insert(
    OutboxMessageOrmEntity,
    events.map((event) => ({
      id: event.eventId,
      eventType: eventTypeOf(event),
      payload: serializeEvent(event),
      occurredAt: event.occurredAt,
      publishedAt: null,
      attempts: 0,
      lastError: null,
    })),
  );
}
