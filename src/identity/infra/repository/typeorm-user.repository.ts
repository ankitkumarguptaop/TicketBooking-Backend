import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
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

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly orm: Repository<UserOrmEntity>,
    private readonly outbox: OutboxRelay,
  ) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.orm.findOneBy({ id });
    return row ? UserMapper.toDomain(row) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const row = await this.orm.findOneBy({ email: email.value });
    return row ? UserMapper.toDomain(row) : null;
  }

  existsByEmail(email: Email): Promise<boolean> {
    return this.orm.existsBy({ email: email.value });
  }

  existsWithRole(role: UserRole): Promise<boolean> {
    return this.orm.existsBy({ role });
  }

  async save(user: User): Promise<void> {
    try {
      // The row and its events commit together (transactional outbox).
      await this.orm.manager.transaction(async (manager) => {
        await manager.save(UserMapper.toPersistence(user));
        await appendToOutbox(manager, user.pullDomainEvents());
      });
      this.outbox.nudge();
    } catch (err) {
      // Two signups with the same email raced past existsByEmail().
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
