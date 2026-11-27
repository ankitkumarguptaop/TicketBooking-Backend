import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Catalog context: `catalog.theatres`.
 * Touches only the catalog schema (docs/REQUIREMENTS.md §5.1).
 */
export class CreateCatalogTheatres1795687000000 implements MigrationInterface {
  name = 'CreateCatalogTheatres1795687000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "catalog"."theatres" (
        "id"         uuid                     NOT NULL,
        "name"       character varying(120)   NOT NULL,
        "city"       character varying(80)    NOT NULL,
        "address"    character varying(300)   NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "version"    integer                  NOT NULL,
        CONSTRAINT "pk_theatres" PRIMARY KEY ("id")
      )
    `);
    // "theatres in Pune" ignores case.
    await queryRunner.query(
      `CREATE INDEX "ix_theatres_city" ON "catalog"."theatres" (lower("city"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "catalog"."ix_theatres_city"`);
    await queryRunner.query(`DROP TABLE "catalog"."theatres"`);
  }
}
