import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Identity context, migration 5: new enum values only.
 *  - user_role gets SUPER_ADMIN
 *  - session_revocation_reason gets ROLE_CHANGED (admin role revoked)
 * Kept apart from migration 7, which USES 'SUPER_ADMIN' in an index:
 * PostgreSQL refuses a new enum value in the transaction that added it.
 */
export class AddSuperAdminRoleAndRoleChangedReason1795414500000 implements MigrationInterface {
  name = 'AddSuperAdminRoleAndRoleChangedReason1795414500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "identity"."user_role" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN'`,
    );
    await queryRunner.query(
      `ALTER TYPE "identity"."session_revocation_reason" ADD VALUE IF NOT EXISTS 'ROLE_CHANGED'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL can't drop one enum value: rebuild each type without it.
    // The super admin becomes a plain ADMIN.
    await queryRunner.query(
      `UPDATE "identity"."users" SET "role" = 'ADMIN' WHERE "role" = 'SUPER_ADMIN'`,
    );
    await queryRunner.query(
      `ALTER TABLE "identity"."users" ALTER COLUMN "role" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TYPE "identity"."user_role" RENAME TO "user_role_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "identity"."user_role" AS ENUM ('USER', 'ADMIN')`,
    );
    await queryRunner.query(
      `ALTER TABLE "identity"."users"
         ALTER COLUMN "role" TYPE "identity"."user_role"
         USING "role"::text::"identity"."user_role"`,
    );
    await queryRunner.query(
      `ALTER TABLE "identity"."users" ALTER COLUMN "role" SET DEFAULT 'USER'`,
    );
    await queryRunner.query(`DROP TYPE "identity"."user_role_old"`);

    await queryRunner.query(
      `UPDATE "identity"."user_sessions" SET "revoked_reason" = 'LOGOUT_ALL' WHERE "revoked_reason" = 'ROLE_CHANGED'`,
    );
    await queryRunner.query(
      `ALTER TYPE "identity"."session_revocation_reason" RENAME TO "session_revocation_reason_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "identity"."session_revocation_reason" AS ENUM ('LOGOUT', 'LOGOUT_ALL', 'REVOKED_BY_USER', 'REUSE_DETECTED', 'USER_GONE', 'PASSWORD_RESET')`,
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
