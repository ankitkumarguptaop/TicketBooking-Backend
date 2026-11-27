import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Catalog context: the `catalog` schema and `catalog.movies`.
 * Touches only the catalog schema (docs/REQUIREMENTS.md §5.1).
 */
export class CreateCatalogMovies1795686200000 implements MigrationInterface {
  name = 'CreateCatalogMovies1795686200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "catalog"`);

    await queryRunner.query(`
      CREATE TYPE "catalog"."movie_certificate"
        AS ENUM ('U', 'UA_7', 'UA_13', 'UA_16', 'A', 'S')
    `);

    // language / runtime / certificate are nullable: required before a show
    // can be scheduled, not before the movie exists (draft first, finish later).
    await queryRunner.query(`
      CREATE TABLE "catalog"."movies" (
        "id"              uuid                          NOT NULL,
        "title"           character varying(200)        NOT NULL,
        "description"     text,
        "genres"          character varying(30)[]       NOT NULL DEFAULT '{}',
        "language"        character varying(2),
        "runtime_minutes" integer,
        "certificate"     "catalog"."movie_certificate",
        "release_date"    date,
        "poster_url"      character varying(2048),
        "created_at"      TIMESTAMP WITH TIME ZONE      NOT NULL,
        "updated_at"      TIMESTAMP WITH TIME ZONE      NOT NULL,
        "version"         integer                       NOT NULL,
        CONSTRAINT "pk_movies"          PRIMARY KEY ("id"),
        CONSTRAINT "ck_movies_runtime"  CHECK ("runtime_minutes" BETWEEN 1 AND 600),
        CONSTRAINT "ck_movies_language" CHECK ("language" ~ '^[a-z]{2}$')
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "catalog"."movies"`);
    await queryRunner.query(`DROP TYPE "catalog"."movie_certificate"`);
    // The schema is left in place: other catalog tables may live in it.
  }
}
