import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Catalog context: `catalog.seats` (a screen's seat layout) and the
 * `seat_category` enum, which `show_prices` reuses later.
 * Touches only the catalog schema (docs/REQUIREMENTS.md §5.1).
 */
export class CreateCatalogSeats1795687200000 implements MigrationInterface {
  name = 'CreateCatalogSeats1795687200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "catalog"."seat_category" AS ENUM ('REGULAR', 'PREMIUM', 'RECLINER')
    `);

    await queryRunner.query(`
      CREATE TABLE "catalog"."seats" (
        "id"          uuid                      NOT NULL,
        "screen_id"   uuid                      NOT NULL,
        "row_label"   character varying(3)      NOT NULL,
        "seat_number" integer                   NOT NULL,
        "category"    "catalog"."seat_category" NOT NULL,
        "grid_row"    integer                   NOT NULL,
        "grid_col"    integer                   NOT NULL,
        CONSTRAINT "pk_seats" PRIMARY KEY ("id"),
        -- "seat numbers unique within a screen"
        CONSTRAINT "uq_seats_screen_label"    UNIQUE ("screen_id", "row_label", "seat_number"),
        CONSTRAINT "uq_seats_screen_position" UNIQUE ("screen_id", "grid_row", "grid_col"),
        CONSTRAINT "ck_seats_number" CHECK ("seat_number" >= 1),
        CONSTRAINT "ck_seats_grid"   CHECK ("grid_row" >= 0 AND "grid_col" >= 0),
        CONSTRAINT "fk_seats_screen" FOREIGN KEY ("screen_id")
          REFERENCES "catalog"."screens" ("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "catalog"."seats"`);
    await queryRunner.query(`DROP TYPE "catalog"."seat_category"`);
  }
}
