import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Identity context, migration 7: admins by approval.
 *  - `identity.admin_access_requests`: a user asks, the super admin decides
 *  - at most one PENDING request per user (partial unique index)
 *  - at most one SUPER_ADMIN in `identity.users` (partial unique index)
 */
export class CreateAdminAccessRequests1795414700000 implements MigrationInterface {
  name = 'CreateAdminAccessRequests1795414700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "identity"."admin_access_request_status" AS ENUM (
        'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "identity"."admin_access_requests" (
        "id"            uuid                                       NOT NULL,
        "user_id"       uuid                                       NOT NULL,
        "reason"        character varying(500)                     NOT NULL,
        "status"        "identity"."admin_access_request_status"   NOT NULL,
        "requested_at"  TIMESTAMP WITH TIME ZONE                   NOT NULL,
        "decided_at"    TIMESTAMP WITH TIME ZONE,
        "decided_by"    uuid,
        "decision_note" character varying(500),
        "version"       integer                                    NOT NULL,
        CONSTRAINT "pk_admin_access_requests" PRIMARY KEY ("id"),
        -- PENDING <=> not decided yet
        CONSTRAINT "ck_admin_access_requests_decided"
          CHECK (("status" = 'PENDING') = ("decided_at" IS NULL)),
        -- approved/rejected name the super admin; pending/cancelled don't
        CONSTRAINT "ck_admin_access_requests_decided_by"
          CHECK (("status" IN ('APPROVED', 'REJECTED')) = ("decided_by" IS NOT NULL))
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_admin_access_requests_one_pending"
        ON "identity"."admin_access_requests" ("user_id")
        WHERE "status" = 'PENDING'
    `);

    // "pending requests, oldest first" (the super admin's queue)
    await queryRunner.query(`
      CREATE INDEX "ix_admin_access_requests_status_requested"
        ON "identity"."admin_access_requests" ("status", "requested_at")
    `);

    // Same-context FKs. A deleted user takes their requests with them.
    // The deciding super admin can't be deleted while requests name them
    // (NO ACTION): the audit trail must not silently lose who decided.
    await queryRunner.query(`
      ALTER TABLE "identity"."admin_access_requests"
        ADD CONSTRAINT "fk_admin_access_requests_user"
        FOREIGN KEY ("user_id") REFERENCES "identity"."users" ("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "identity"."admin_access_requests"
        ADD CONSTRAINT "fk_admin_access_requests_decided_by"
        FOREIGN KEY ("decided_by") REFERENCES "identity"."users" ("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // Exactly one super admin can exist: a constant expression, unique
    // among the rows where role = SUPER_ADMIN.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_users_single_super_admin"
        ON "identity"."users" ((true))
        WHERE "role" = 'SUPER_ADMIN'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "identity"."uq_users_single_super_admin"`,
    );
    await queryRunner.query(`DROP TABLE "identity"."admin_access_requests"`);
    await queryRunner.query(
      `DROP TYPE "identity"."admin_access_request_status"`,
    );
  }
}
