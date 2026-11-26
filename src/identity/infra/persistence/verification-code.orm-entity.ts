import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { VerificationChannel } from '../../domain/verification/verification-channel.enum';
import { UserOrmEntity } from './user.orm-entity';

/** One row per code sent. Never leaves the infrastructure layer. */
@Entity({ schema: 'identity', name: 'verification_codes' })
/** "Newest code for user X on channel Y" is the only lookup. */
@Index('ix_verification_codes_user_channel_created', [
  'userId',
  'channel',
  'createdAt',
])
@Check('ck_verification_codes_attempts', '"attempts" >= 0')
export class VerificationCodeOrmEntity {
  @PrimaryColumn('uuid', { primaryKeyConstraintName: 'pk_verification_codes' })
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  /** Same-context FK: deleting a user deletes their codes. Never loaded. */
  @ManyToOne(() => UserOrmEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'fk_verification_codes_user',
  })
  user?: UserOrmEntity;

  @Column({
    type: 'enum',
    enum: VerificationChannel,
    enumName: 'verification_channel',
  })
  channel!: VerificationChannel;

  /** Email (≤320) or phone (≤16) at the time the code was sent. */
  @Column({ type: 'varchar', length: 320 })
  destination!: string;

  /** HMAC-SHA256 (hex) of the code. The code itself is never stored. */
  @Column({ name: 'code_hash', type: 'char', length: 64 })
  codeHash!: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'int' })
  attempts!: number;

  @Column({ name: 'consumed_at', type: 'timestamptz', nullable: true })
  consumedAt!: Date | null;

  /** Optimistic lock: two guesses racing on one code can't both be counted as one. */
  @Column({ type: 'int' })
  version!: number;
}
