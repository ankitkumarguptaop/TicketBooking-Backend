import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { AdminAccessRequest } from '../../domain/admin-access/admin-access-request.aggregate';
import { AdminAccessRequestRepository } from '../../domain/ports/admin-access-request.repository';
import { AdminAccessRequestStatus } from '../../domain/admin-access/admin-access-request-status.enum';
import {
  AdminAccessRequestAlreadyPendingError,
  ConcurrentAdminAccessUpdateError,
} from '../../domain/errors/identity.errors';
import { appendToOutbox } from '../messaging/outbox-writer';
import { OutboxRelay } from '../messaging/outbox-relay.service';
import { AdminAccessRequestMapper } from '../mappers/admin-access-request.mapper';
import { AdminAccessRequestOrmEntity } from '../entities/admin-access-request.orm-entity';

const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class TypeOrmAdminAccessRequestRepository implements AdminAccessRequestRepository {
  constructor(
    @InjectRepository(AdminAccessRequestOrmEntity)
    private readonly orm: Repository<AdminAccessRequestOrmEntity>,
    private readonly outbox: OutboxRelay,
  ) {}

  async findById(id: string): Promise<AdminAccessRequest | null> {
    const row = await this.orm.findOneBy({ id });
    return row ? AdminAccessRequestMapper.toDomain(row) : null;
  }

  async findPendingByUserId(
    userId: string,
  ): Promise<AdminAccessRequest | null> {
    const row = await this.orm.findOneBy({
      userId,
      status: AdminAccessRequestStatus.PENDING,
    });
    return row ? AdminAccessRequestMapper.toDomain(row) : null;
  }

  async save(request: AdminAccessRequest): Promise<void> {
    const changed = AdminAccessRequestMapper.toChangedColumns(request);
    try {
      await this.orm.manager.transaction(async (manager) => {
        if (request.version === 0) {
          await manager.insert(AdminAccessRequestOrmEntity, {
            id: request.id,
            userId: request.userId,
            reason: request.reason,
            requestedAt: request.requestedAt,
            version: 1,
            ...changed,
          });
        } else {
          // Compare-and-swap: two super-admin tabs can't both decide it.
          const result = await manager.update(
            AdminAccessRequestOrmEntity,
            { id: request.id, version: request.version },
            { ...changed, version: request.version + 1 },
          );
          if (result.affected !== 1) {
            throw new ConcurrentAdminAccessUpdateError();
          }
        }
        await appendToOutbox(manager, request.pullDomainEvents());
      });
    } catch (err) {
      // Two submits raced past findPendingByUserId(): the partial unique
      // index "one PENDING per user" stopped the second one.
      const driver =
        err instanceof QueryFailedError
          ? (err.driverError as { code?: string; constraint?: string })
          : undefined;
      if (
        driver?.code === PG_UNIQUE_VIOLATION &&
        driver.constraint === 'uq_admin_access_requests_one_pending'
      ) {
        throw new AdminAccessRequestAlreadyPendingError();
      }
      throw err;
    }
    this.outbox.nudge();
  }
}
