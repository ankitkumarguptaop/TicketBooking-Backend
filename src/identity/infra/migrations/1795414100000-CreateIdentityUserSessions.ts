import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Identity context, migration 2: `identity.user_sessions`.
 * One row per device login; holds the hash of the single currently valid
 * refresh token (see docs/AUTHENTICATION.md §5).
 */
export class CreateIdentityUserSessions1795414100000 implements MigrationInterface {
  name = 'CreateIdentityUserSessions1795414100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "identity"."session_revocation_reason" AS ENUM (
        'LOGOUT',
        'LOGOUT_ALL',
        'REVOKED_BY_USER',
        'REUSE_DETECTED',
        'USER_GONE'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "identity"."user_sessions" (
        "id"                  uuid                                   NOT NULL,
        "user_id"             uuid                                   NOT NULL,
        "token_hash"          character(64)                          NOT NULL,
        "device_name"         character varying(100),
        "user_agent"          character varying(512),
        "ip_address"          character varying(45),
        "created_at"          TIMESTAMP WITH TIME ZONE               NOT NULL,
        "last_used_at"        TIMESTAMP WITH TIME ZONE               NOT NULL,
        "idle_expires_at"     TIMESTAMP WITH TIME ZONE               NOT NULL,
        "absolute_expires_at" TIMESTAMP WITH TIME ZONE               NOT NULL,
        "revoked_at"          TIMESTAMP WITH TIME ZONE,
        "revoked_reason"      "identity"."session_revocation_reason",
        "version"             integer                                NOT NULL,
        CONSTRAINT "pk_user_sessions" PRIMARY KEY ("id"),
        -- revoked <=> has a reason: a half-revoked row cannot exist
        CONSTRAINT "ck_user_sessions_revocation"
          CHECK (("revoked_at" IS NULL) = ("revoked_reason" IS NULL)),
        -- rotation never extends a session past its absolute lifetime
        CONSTRAINT "ck_user_sessions_expiry_order"
          CHECK ("idle_expires_at" <= "absolute_expires_at")
      )
    `);

    // "active sessions of user X" (session list, logout-all)
    await queryRunner.query(`
      CREATE INDEX "ix_user_sessions_user_active"
        ON "identity"."user_sessions" ("user_id", "revoked_at")
    `);

    // Same-context FK: deleting a user deletes their sessions.
    await queryRunner.query(`
      ALTER TABLE "identity"."user_sessions"
        ADD CONSTRAINT "fk_user_sessions_user"
        FOREIGN KEY ("user_id") REFERENCES "identity"."users" ("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "identity"."user_sessions" DROP CONSTRAINT "fk_user_sessions_user"`,
    );
    await queryRunner.query(
      `DROP INDEX "identity"."ix_user_sessions_user_active"`,
    );
    await queryRunner.query(`DROP TABLE "identity"."user_sessions"`);
    await queryRunner.query(`DROP TYPE "identity"."session_revocation_reason"`);
  }
}
