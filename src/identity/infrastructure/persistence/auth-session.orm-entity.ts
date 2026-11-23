import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { SessionRevocationReason } from '../../domain/session/session-revocation-reason.enum';
import { UserOrmEntity } from './user.orm-entity';

/** One row per device login. Never leaves the infrastructure layer. */
@Entity({ schema: 'identity', name: 'user_sessions' })
@Index('ix_user_sessions_user_active', ['userId', 'revokedAt'])
/** Revoked <=> has a reason. A half-revoked row can't exist. */
@Check(
  'ck_user_sessions_revocation',
  '("revoked_at" IS NULL) = ("revoked_reason" IS NULL)',
)
@Check(
  'ck_user_sessions_expiry_order',
  '"idle_expires_at" <= "absolute_expires_at"',
)
export class AuthSessionOrmEntity {
  @PrimaryColumn('uuid', { primaryKeyConstraintName: 'pk_user_sessions' })
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  /**
   * Same-context FK (identity.users), so it is allowed. Deleting a user
   * deletes their sessions. Only declared for the schema; never loaded.
   */
  @ManyToOne(() => UserOrmEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'fk_user_sessions_user',
  })
  user?: UserOrmEntity;

  /** HMAC-SHA256 (hex) of the current refresh token. The token itself is never stored. */
  @Column({ name: 'token_hash', type: 'char', length: 64 })
  tokenHash!: string;

  @Column({ name: 'device_name', type: 'varchar', length: 100, nullable: true })
  deviceName!: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 512, nullable: true })
  userAgent!: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'last_used_at', type: 'timestamptz' })
  lastUsedAt!: Date;

  @Column({ name: 'idle_expires_at', type: 'timestamptz' })
  idleExpiresAt!: Date;

  @Column({ name: 'absolute_expires_at', type: 'timestamptz' })
  absoluteExpiresAt!: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @Column({
    name: 'revoked_reason',
    type: 'enum',
    enum: SessionRevocationReason,
    enumName: 'session_revocation_reason',
    nullable: true,
  })
  revokedReason!: SessionRevocationReason | null;

  /** Optimistic lock: two concurrent rotations of one session cannot both win. */
  @Column({ type: 'int' })
  version!: number;
}
