import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { AdminAccessRequestStatus } from '../../domain/admin-access/admin-access-request-status.enum';
import { UserOrmEntity } from './user.orm-entity';

/** Database shape of an admin-access request. Never leaves the infrastructure layer. */
@Entity({ schema: 'identity', name: 'admin_access_requests' })
/** Last guard for "one PENDING request per user", even under concurrent submits. */
@Index('uq_admin_access_requests_one_pending', ['userId'], {
  unique: true,
  where: `"status" = 'PENDING'`,
})
@Index('ix_admin_access_requests_status_requested', ['status', 'requestedAt'])
/** PENDING <=> not decided yet. */
@Check(
  'ck_admin_access_requests_decided',
  `("status" = 'PENDING') = ("decided_at" IS NULL)`,
)
/** Approved/rejected name the super admin; pending/cancelled don't. */
@Check(
  'ck_admin_access_requests_decided_by',
  `("status" IN ('APPROVED', 'REJECTED')) = ("decided_by" IS NOT NULL)`,
)
export class AdminAccessRequestOrmEntity {
  @PrimaryColumn('uuid', {
    primaryKeyConstraintName: 'pk_admin_access_requests',
  })
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  /** Same-context FK. Deleting a user deletes their requests. Never loaded. */
  @ManyToOne(() => UserOrmEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'fk_admin_access_requests_user',
  })
  user?: UserOrmEntity;

  @Column({ type: 'varchar', length: 500 })
  reason!: string;

  @Column({
    type: 'enum',
    enum: AdminAccessRequestStatus,
    enumName: 'admin_access_request_status',
  })
  status!: AdminAccessRequestStatus;

  @Column({ name: 'requested_at', type: 'timestamptz' })
  requestedAt!: Date;

  @Column({ name: 'decided_at', type: 'timestamptz', nullable: true })
  decidedAt!: Date | null;

  @Column({ name: 'decided_by', type: 'uuid', nullable: true })
  decidedBy!: string | null;

  /** The deciding super admin can't be deleted while a request names them. */
  @ManyToOne(() => UserOrmEntity, { onDelete: 'NO ACTION', nullable: true })
  @JoinColumn({
    name: 'decided_by',
    foreignKeyConstraintName: 'fk_admin_access_requests_decided_by',
  })
  decider?: UserOrmEntity;

  @Column({
    name: 'decision_note',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  decisionNote!: string | null;

  @Column({ type: 'int' })
  version!: number;
}
