import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Identity context, migration 6: `identity.outbox` (transactional outbox).
 * Each row is one domain event, inserted in the same transaction as the
 * aggregate change that raised it; OutboxRelay publishes and stamps it.
 */
export class CreateIdentityOutbox1795414600000 implements MigrationInterface {
  name = 'CreateIdentityOutbox1795414600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "identity"."outbox" (
        "id"           uuid                     NOT NULL,
        "event_type"   character varying(100)   NOT NULL,
        "payload"      jsonb                    NOT NULL,
        "occurred_at"  TIMESTAMP WITH TIME ZONE NOT NULL,
        "published_at" TIMESTAMP WITH TIME ZONE,
        "attempts"     integer                  NOT NULL DEFAULT 0,
        "last_error"   text,
        CONSTRAINT "pk_outbox" PRIMARY KEY ("id"),
        CONSTRAINT "ck_outbox_attempts" CHECK ("attempts" >= 0)
      )
    `);

    // The relay's query: oldest unpublished first. Partial, so it stays
    // tiny however many published rows the table keeps.
    await queryRunner.query(`
      CREATE INDEX "ix_outbox_unpublished"
        ON "identity"."outbox" ("occurred_at")
        WHERE "published_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "identity"."ix_outbox_unpublished"`);
    await queryRunner.query(`DROP TABLE "identity"."outbox"`);
  }
}
