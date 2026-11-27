import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Catalog context: `catalog.screens` (belongs to a theatre).
 * Touches only the catalog schema (docs/REQUIREMENTS.md §5.1).
 */
export class CreateCatalogScreens1795687100000 implements MigrationInterface {
  name = 'CreateCatalogScreens1795687100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "catalog"."screens" (
        "id"         uuid                     NOT NULL,
        "theatre_id" uuid                     NOT NULL,
        "name"       character varying(50)    NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "version"    integer                  NOT NULL,
        CONSTRAINT "pk_screens" PRIMARY KEY ("id"),
        CONSTRAINT "uq_screens_theatre_name" UNIQUE ("theatre_id", "name"),
        CONSTRAINT "fk_screens_theatre" FOREIGN KEY ("theatre_id")
          REFERENCES "catalog"."theatres" ("id") ON DELETE RESTRICT
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "catalog"."screens"`);
  }
}
