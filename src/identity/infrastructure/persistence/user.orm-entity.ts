import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import { UserRole } from '../../domain/user-role.enum';

/** Database shape of a user. Never leaves the infrastructure layer. */
@Entity({ schema: 'identity', name: 'users' })
export class UserOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  /** Last guard for "email is unique", even under concurrent signups. */
  @Column({ type: 'varchar', length: 320, unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 100 })
  fullName!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
