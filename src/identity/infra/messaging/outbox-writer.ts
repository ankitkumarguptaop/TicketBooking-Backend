import { EntityManager } from 'typeorm';
import { DomainEvent } from '../../../shared/domain/domain-event';
import { eventTypeOf, serializeEvent } from './identity-event-registry';

/**
 * Appends events to identity.outbox using the CALLER's transaction
 * (`manager`), so they commit or roll back with the aggregate's own rows.
 * One multi-row INSERT; published_at, attempts and last_error take their defaults.
 */
export async function appendToOutbox(
  manager: EntityManager,
  events: DomainEvent[],
): Promise<void> {
  if (events.length === 0) return;

  const params: unknown[] = [];
  const tuples = events.map((event, i) => {
    const p = i * 4;
    params.push(
      event.eventId,
      eventTypeOf(event),
      JSON.stringify(serializeEvent(event)),
      event.occurredAt,
    );
    return `($${p + 1}, $${p + 2}, $${p + 3}::jsonb, $${p + 4})`;
  });

  await manager.query(
    `INSERT INTO identity.outbox (id, event_type, payload, occurred_at)
     VALUES ${tuples.join(', ')}`,
    params,
  );
}
