import { Injectable } from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';
import { EmailAlreadyRegisteredError } from '../../domain/errors/identity.errors';
import { User } from '../../domain/user.aggregate';
import { UserRole } from '../../../shared/domain/user-role.enum';
import { UserRepository } from '../../domain/ports/user.repository';
import { Email } from '../../domain/value-objects/email.vo';
import { UserMapper } from '../mappers/user.mapper';
import { UserOrmEntity } from '../entities/user.orm-entity';
import { appendToOutbox } from '../messaging/outbox-writer';
import { OutboxRelay } from '../messaging/outbox-relay.service';

const PG_UNIQUE_VIOLATION = '23505';

/** Aliased to the UserOrmEntity field names, so the mapper reads rows as-is. */
const USER_COLUMNS = `
  id, email, password_hash AS "passwordHash", full_name AS "fullName", phone,
  role, created_at AS "createdAt", email_verified_at AS "emailVerifiedAt",
  phone_verified_at AS "phoneVerifiedAt"
`;

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly outbox: OutboxRelay,
  ) {}

  async findById(id: string): Promise<User | null> {
    const rows = await this.dataSource.query<UserOrmEntity[]>(
      `SELECT ${USER_COLUMNS} FROM identity.users WHERE id = $1`,
      [id],
    );
    return rows[0] ? UserMapper.toDomain(rows[0]) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const rows = await this.dataSource.query<UserOrmEntity[]>(
      `SELECT ${USER_COLUMNS} FROM identity.users WHERE email = $1`,
      [email.value],
    );
    return rows[0] ? UserMapper.toDomain(rows[0]) : null;
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const [{ exists }] = await this.dataSource.query<{ exists: boolean }[]>(
      `SELECT EXISTS (SELECT 1 FROM identity.users WHERE email = $1) AS "exists"`,
      [email.value],
    );
    return exists;
  }

  async existsWithRole(role: UserRole): Promise<boolean> {
    const [{ exists }] = await this.dataSource.query<{ exists: boolean }[]>(
      `SELECT EXISTS (SELECT 1 FROM identity.users WHERE role = $1) AS "exists"`,
      [role],
    );
    return exists;
  }

  async save(user: User): Promise<void> {
    const row = UserMapper.toPersistence(user);
    try {
      // The row and its events commit together (transactional outbox).
      await this.dataSource.transaction(async (manager) => {
        // Insert, or update every column except id and created_at.
        await manager.query(
          `INSERT INTO identity.users
             (id, email, password_hash, full_name, phone, role, created_at,
              email_verified_at, phone_verified_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET
             email             = EXCLUDED.email,
             password_hash     = EXCLUDED.password_hash,
             full_name         = EXCLUDED.full_name,
             phone             = EXCLUDED.phone,
             role              = EXCLUDED.role,
             email_verified_at = EXCLUDED.email_verified_at,
             phone_verified_at = EXCLUDED.phone_verified_at`,
          [
            row.id,
            row.email,
            row.passwordHash,
            row.fullName,
            row.phone,
            row.role,
            row.createdAt,
            row.emailVerifiedAt,
            row.phoneVerifiedAt,
          ],
        );
        await appendToOutbox(manager, user.pullDomainEvents());
      });
      this.outbox.nudge();
    } catch (err) {
      // Two signups with the same email raced past existsByEmail().
      // ON CONFLICT (id) only covers the primary key, so this still fires.
      const driver =
        err instanceof QueryFailedError
          ? (err.driverError as { code?: string; constraint?: string })
          : undefined;
      if (
        driver?.code === PG_UNIQUE_VIOLATION &&
        driver.constraint === 'uq_users_email'
      ) {
        throw new EmailAlreadyRegisteredError();
      }
      throw err;
    }
  }
}
