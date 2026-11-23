import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Identity context, migration 4: password reset.
 *  - reset codes reuse verification_codes with a new purpose value
 *  - sessions ended by a reset get their own revocation reason (the code
 *    enum already had PASSWORD_RESET; the database type did not)
 * (ADD VALUE needs PostgreSQL 12+ to run inside a transaction.)
 */
export class AddPasswordResetCodes1795414400000 implements MigrationInterface {
  name = 'AddPasswordResetCodes1795414400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "identity"."verification_channel" ADD VALUE IF NOT EXISTS 'PASSWORD_RESET'`,
    );
    await queryRunner.query(
      `ALTER TYPE "identity"."session_revocation_reason" ADD VALUE IF NOT EXISTS 'PASSWORD_RESET'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL can't drop one enum value: rebuild the type without it.
    await queryRunner.query(
      `DELETE FROM "identity"."verification_codes" WHERE "channel" = 'PASSWORD_RESET'`,
    );
    await queryRunner.query(
      `ALTER TYPE "identity"."verification_channel" RENAME TO "verification_channel_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "identity"."verification_channel" AS ENUM ('EMAIL', 'PHONE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "identity"."verification_codes"
         ALTER COLUMN "channel" TYPE "identity"."verification_channel"
         USING "channel"::text::"identity"."verification_channel"`,
    );
    await queryRunner.query(`DROP TYPE "identity"."verification_channel_old"`);

    // Same for the revocation reason; reset-ended sessions become LOGOUT_ALL.
    await queryRunner.query(
      `UPDATE "identity"."user_sessions" SET "revoked_reason" = 'LOGOUT_ALL' WHERE "revoked_reason" = 'PASSWORD_RESET'`,
    );
    await queryRunner.query(
      `ALTER TYPE "identity"."session_revocation_reason" RENAME TO "session_revocation_reason_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "identity"."session_revocation_reason" AS ENUM ('LOGOUT', 'LOGOUT_ALL', 'REVOKED_BY_USER', 'REUSE_DETECTED', 'USER_GONE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "identity"."user_sessions"
         ALTER COLUMN "revoked_reason" TYPE "identity"."session_revocation_reason"
         USING "revoked_reason"::text::"identity"."session_revocation_reason"`,
    );
    await queryRunner.query(
      `DROP TYPE "identity"."session_revocation_reason_old"`,
    );
  }
}
