import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import { UserRole } from '../../domain/user-role.enum';

/** Database shape of a user. Never leaves the infrastructure layer. */
@Entity({ schema: 'identity', name: 'users' })
/** Last guard for "email is unique", even under concurrent signups. */
@Unique('uq_users_email', ['email'])
/**
 * At most one SUPER_ADMIN. An expression index ((true)) WHERE role =
 * 'SUPER_ADMIN', which TypeORM can't describe, so it lives only in
 * migration 7 and `synchronize: false` stops migration:generate dropping it.
 */
@Index('uq_users_single_super_admin', { synchronize: false })
export class UserOrmEntity {
  @PrimaryColumn('uuid', { primaryKeyConstraintName: 'pk_users' })
  id!: string;

  @Column({ type: 'varchar', length: 320 })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 100 })
  fullName!: string;

  @Column({ type: 'varchar', length: 16 })
  phone!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    enumName: 'user_role',
    default: UserRole.USER,
  })
  role!: UserRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'email_verified_at', type: 'timestamptz', nullable: true })
  emailVerifiedAt!: Date | null;

  @Column({ name: 'phone_verified_at', type: 'timestamptz', nullable: true })
  phoneVerifiedAt!: Date | null;
}
