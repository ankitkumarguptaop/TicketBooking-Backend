import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Catalog context: `catalog.shows`. Touches only the catalog schema,
 * apart from the btree_gist extension (database-wide).
 */
export class CreateCatalogShows1795688000000 implements MigrationInterface {
  name = 'CreateCatalogShows1795688000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Lets a GiST index compare plain uuids with "=" next to the range "&&".
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS btree_gist`);

    await queryRunner.query(`
      CREATE TYPE "catalog"."show_status" AS ENUM ('SCHEDULED', 'CANCELLED')
    `);

    await queryRunner.query(`
      CREATE TABLE "catalog"."shows" (
        "id"            uuid                     NOT NULL,
        "movie_id"      uuid                     NOT NULL,
        "screen_id"     uuid                     NOT NULL,
        "starts_at"     TIMESTAMP WITH TIME ZONE NOT NULL,
        "ends_at"       TIMESTAMP WITH TIME ZONE NOT NULL,
        "blocked_until" TIMESTAMP WITH TIME ZONE NOT NULL,
        "status"        "catalog"."show_status"  NOT NULL,
        "cancelled_at"  TIMESTAMP WITH TIME ZONE,
        "cancel_reason" character varying(300),
        "created_at"    TIMESTAMP WITH TIME ZONE NOT NULL,
        "updated_at"    TIMESTAMP WITH TIME ZONE NOT NULL,
        "version"       integer                  NOT NULL,
        CONSTRAINT "pk_shows" PRIMARY KEY ("id"),
        -- Same schema, so real FKs. RESTRICT: a movie or screen with shows
        -- (past or future) can't be hard-deleted; booking history needs them.
        CONSTRAINT "fk_shows_movie" FOREIGN KEY ("movie_id")
          REFERENCES "catalog"."movies" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_shows_screen" FOREIGN KEY ("screen_id")
          REFERENCES "catalog"."screens" ("id") ON DELETE RESTRICT,
        CONSTRAINT "ck_shows_times"
          CHECK ("ends_at" > "starts_at" AND "blocked_until" >= "ends_at"),
        CONSTRAINT "ck_shows_cancelled"
          CHECK (("status" = 'CANCELLED') = ("cancelled_at" IS NOT NULL)),
        -- Shows on one screen never overlap, cleaning gap included.
        -- Cancelled shows free their slot. '[)': back-to-back is allowed.
        CONSTRAINT "ex_shows_screen_no_overlap" EXCLUDE USING gist (
          "screen_id" WITH =,
          tstzrange("starts_at", "blocked_until", '[)') WITH &&
        ) WHERE ("status" = 'SCHEDULED')
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "ix_shows_movie_starts" ON "catalog"."shows" ("movie_id", "starts_at")
        WHERE "status" = 'SCHEDULED'
    `);
    // Listing filters on starts_at (date / upcoming) and joins to the screen.
    await queryRunner.query(`
      CREATE INDEX "ix_shows_starts" ON "catalog"."shows" ("starts_at")
        WHERE "status" = 'SCHEDULED'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "catalog"."ix_shows_starts"`);
    await queryRunner.query(`DROP INDEX "catalog"."ix_shows_movie_starts"`);
    await queryRunner.query(`DROP TABLE "catalog"."shows"`);
    await queryRunner.query(`DROP TYPE "catalog"."show_status"`);
    // btree_gist is left installed: other schemas may use it.
  }
}
