import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { ConcurrentSessionUpdateError } from '../../domain/errors/identity.errors';
import { AuthSession } from '../../domain/session/auth-session.aggregate';
import { AuthSessionRepository } from '../../domain/session/auth-session.repository';
import { AuthSessionMapper } from './auth-session.mapper';
import { AuthSessionOrmEntity } from './auth-session.orm-entity';

@Injectable()
export class TypeOrmAuthSessionRepository implements AuthSessionRepository {
  constructor(
    @InjectRepository(AuthSessionOrmEntity)
    private readonly orm: Repository<AuthSessionOrmEntity>,
  ) {}

  async findById(id: string): Promise<AuthSession | null> {
    const row = await this.orm.findOneBy({ id });
    return row ? AuthSessionMapper.toDomain(row) : null;
  }

  async findActiveByUserId(userId: string, now: Date): Promise<AuthSession[]> {
    const rows = await this.orm.find({
      where: {
        userId,
        revokedAt: IsNull(),
        idleExpiresAt: MoreThan(now),
        absoluteExpiresAt: MoreThan(now),
      },
      order: { lastUsedAt: 'DESC' },
    });
    return rows.map((row) => AuthSessionMapper.toDomain(row));
  }

  async save(session: AuthSession): Promise<void> {
    const changed = AuthSessionMapper.toChangedColumns(session);

    if (session.version === 0) {
      await this.orm.insert({
        id: session.id,
        userId: session.userId,
        createdAt: session.createdAt,
        version: 1,
        ...changed,
      });
      return;
    }

    // Compare-and-swap: only succeeds if nobody saved since we loaded it.
    // UPDATE ... SET ..., version = version + 1 WHERE id = $1 AND version = $2
    const result = await this.orm.update(
      { id: session.id, version: session.version },
      { ...changed, version: session.version + 1 },
    );
    if (result.affected !== 1) {
      throw new ConcurrentSessionUpdateError(session.id);
    }
  }
}
