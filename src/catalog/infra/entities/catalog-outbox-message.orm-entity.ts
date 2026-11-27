import { Check, Column, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * One catalog domain event (e.g. MovieAdded) waiting to be published.
 * Written in the SAME transaction as the Movie change that raised it.
 * Same shape as identity.outbox; the class name differs so TypeORM
 * metadata never confuses the two.
 */
@Entity({ schema: 'catalog', name: 'outbox' })
@Index('ix_outbox_unpublished', ['occurredAt'], {
  where: '"published_at" IS NULL',
})
@Check('ck_outbox_attempts', '"attempts" >= 0')
export class CatalogOutboxMessageOrmEntity {
  /** The event's own eventId: a consumer can dedupe on it. */
  @PrimaryColumn('uuid', { primaryKeyConstraintName: 'pk_outbox' })
  id!: string;

  /** Registry key, e.g. "MovieAdded". */
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

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError!: string | null;
}
