import { Check, Column, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * One domain event waiting to be (or already) published.
 * Written in the SAME transaction as the aggregate that raised it, so the
 * state change and its event are stored together or not at all.
 */
@Entity({ schema: 'identity', name: 'outbox' })
@Index('ix_outbox_unpublished', ['occurredAt'], {
  where: '"published_at" IS NULL',
})
@Check('ck_outbox_attempts', '"attempts" >= 0')
export class OutboxMessageOrmEntity {
  /** The event's own eventId: a consumer can dedupe on it. */
  @PrimaryColumn('uuid', { primaryKeyConstraintName: 'pk_outbox' })
  id!: string;

  /** Registry key, e.g. "SessionRevoked". */
  @Column({ name: 'event_type', type: 'varchar', length: 100 })
  eventType!: string;

  /** The event's fields as JSON (dates as ISO strings). */
  @Column({ type: 'jsonb' })
  payload!: object;

  @Column({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt!: Date;

  /** NULL until the relay has handed it to the event bus. */
  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  /** Failed publish attempts; the relay gives up after a limit. */
  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError!: string | null;
}
