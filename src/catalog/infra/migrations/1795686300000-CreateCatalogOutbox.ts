import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Catalog context: `catalog.outbox` (transactional outbox).
 * Each row is one domain event (e.g. MovieAdded), inserted in the same
 * transaction as the Movie change that raised it.
 */
export class CreateCatalogOutbox1795686300000 implements MigrationInterface {
  name = 'CreateCatalogOutbox1795686300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "catalog"."outbox" (
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

    // The relay's query: oldest unpublished first.
    await queryRunner.query(`
      CREATE INDEX "ix_outbox_unpublished"
        ON "catalog"."outbox" ("occurred_at")
        WHERE "published_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "catalog"."ix_outbox_unpublished"`);
    await queryRunner.query(`DROP TABLE "catalog"."outbox"`);
  }
}
