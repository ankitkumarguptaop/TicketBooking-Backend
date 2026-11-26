import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Identity context, migration 1: the `identity` schema and `identity.users`.
 * Touches only the identity schema (docs/REQUIREMENTS.md §5.1).
 */
export class CreateIdentityUsers1795414000000 implements MigrationInterface {
  name = 'CreateIdentityUsers1795414000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // IF NOT EXISTS: the local docker init script may already have created it.
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "identity"`);

    await queryRunner.query(
      `CREATE TYPE "identity"."user_role" AS ENUM ('USER', 'ADMIN')`,
    );

    await queryRunner.query(`
      CREATE TABLE "identity"."users" (
        "id"            uuid                     NOT NULL,
        "email"         character varying(320)   NOT NULL,
        "password_hash" character varying(255)   NOT NULL,
        "full_name"     character varying(100)   NOT NULL,
        -- optional "+" and up to 15 digits (the E.164 maximum)
        "phone"         character varying(16)    NOT NULL,
        "role"         "identity"."user_role"   NOT NULL DEFAULT 'USER',
        "created_at"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_users"       PRIMARY KEY ("id"),
        -- last line of defence for "one account per email" under concurrent signups
        CONSTRAINT "uq_users_email" UNIQUE ("email")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "identity"."users"`);
    await queryRunner.query(`DROP TYPE "identity"."user_role"`);
    // The schema is left in place: other identity tables may live in it.
  }
}
