import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Catalog context: `catalog.show_prices` (one price per seat category per show).
 * Reuses the `seat_category` enum created with `seats`.
 * Touches only the catalog schema (docs/REQUIREMENTS.md §5.1).
 */
export class CreateCatalogShowPrices1795688100000 implements MigrationInterface {
  name = 'CreateCatalogShowPrices1795688100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "catalog"."show_prices" (
        "show_id"       uuid                      NOT NULL,
        "seat_category" "catalog"."seat_category" NOT NULL,
        "amount_minor"  integer                   NOT NULL,
        "currency"      character(3)              NOT NULL DEFAULT 'INR',
        CONSTRAINT "pk_show_prices" PRIMARY KEY ("show_id", "seat_category"),
        CONSTRAINT "ck_show_prices_amount"   CHECK ("amount_minor" >= 0),
        CONSTRAINT "ck_show_prices_currency" CHECK ("currency" ~ '^[A-Z]{3}$'),
        CONSTRAINT "fk_show_prices_show" FOREIGN KEY ("show_id")
          REFERENCES "catalog"."shows" ("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "catalog"."show_prices"`);
  }
}
