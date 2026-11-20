import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { EmailAlreadyRegisteredError } from '../../domain/errors/identity.errors';
import { User } from '../../domain/user.aggregate';
import { UserRepository } from '../../domain/user.repository';
import { Email } from '../../domain/value-objects/email.vo';
import { UserMapper } from './user.mapper';
import { UserOrmEntity } from './user.orm-entity';

const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly orm: Repository<UserOrmEntity>,
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

  async save(user: User): Promise<void> {
    try {
      await this.orm.save(UserMapper.toPersistence(user));
    } catch (err) {
      // Two signups with the same email raced past existsByEmail().
      if (
        err instanceof QueryFailedError &&
        (err.driverError as { code?: string })?.code === PG_UNIQUE_VIOLATION
      ) {
        throw new EmailAlreadyRegisteredError();
      }
      throw err;
    }
  }
}
