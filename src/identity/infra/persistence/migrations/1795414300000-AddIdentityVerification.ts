import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Identity context, migration 3: email/phone verification.
 *  - when each contact was verified (NULL = not yet) on `identity.users`
 *  - `identity.verification_codes`: one row per OTP sent, hashed
 */
export class AddIdentityVerification1795414300000 implements MigrationInterface {
  name = 'AddIdentityVerification1795414300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "identity"."users"
        ADD "email_verified_at" TIMESTAMP WITH TIME ZONE,
        ADD "phone_verified_at" TIMESTAMP WITH TIME ZONE
    `);

    await queryRunner.query(
      `CREATE TYPE "identity"."verification_channel" AS ENUM ('EMAIL', 'PHONE')`,
    );

    await queryRunner.query(`
      CREATE TABLE "identity"."verification_codes" (
        "id"          uuid                              NOT NULL,
        "user_id"     uuid                              NOT NULL,
        "channel"     "identity"."verification_channel" NOT NULL,
        "destination" character varying(320)            NOT NULL,
        "code_hash"   character(64)                     NOT NULL,
        "created_at"  TIMESTAMP WITH TIME ZONE          NOT NULL,
        "expires_at"  TIMESTAMP WITH TIME ZONE          NOT NULL,
        "attempts"    integer                           NOT NULL,
        "consumed_at" TIMESTAMP WITH TIME ZONE,
        "version"     integer                           NOT NULL,
        CONSTRAINT "pk_verification_codes" PRIMARY KEY ("id"),
        CONSTRAINT "ck_verification_codes_attempts" CHECK ("attempts" >= 0)
      )
    `);

    // "newest code for user X on channel Y"
    await queryRunner.query(`
      CREATE INDEX "ix_verification_codes_user_channel_created"
        ON "identity"."verification_codes" ("user_id", "channel", "created_at")
    `);

    // Same-context FK: deleting a user deletes their codes.
    await queryRunner.query(`
      ALTER TABLE "identity"."verification_codes"
        ADD CONSTRAINT "fk_verification_codes_user"
        FOREIGN KEY ("user_id") REFERENCES "identity"."users" ("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "identity"."verification_codes" DROP CONSTRAINT "fk_verification_codes_user"`,
    );
    await queryRunner.query(
      `DROP INDEX "identity"."ix_verification_codes_user_channel_created"`,
    );
    await queryRunner.query(`DROP TABLE "identity"."verification_codes"`);
    await queryRunner.query(`DROP TYPE "identity"."verification_channel"`);
    await queryRunner.query(`
      ALTER TABLE "identity"."users"
        DROP COLUMN "phone_verified_at",
        DROP COLUMN "email_verified_at"
    `);
  }
}
