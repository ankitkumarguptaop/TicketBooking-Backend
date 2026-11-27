import { Injectable } from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';
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

/** Aliased to the AdminAccessRequestOrmEntity field names, so the mapper reads rows as-is. */
const REQUEST_COLUMNS = `
  id, user_id AS "userId", reason, status, requested_at AS "requestedAt",
  decided_at AS "decidedAt", decided_by AS "decidedBy",
  decision_note AS "decisionNote", version
`;

@Injectable()
export class TypeOrmAdminAccessRequestRepository implements AdminAccessRequestRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly outbox: OutboxRelay,
  ) {}

  async findById(id: string): Promise<AdminAccessRequest | null> {
    const rows = await this.dataSource.query<AdminAccessRequestOrmEntity[]>(
      `SELECT ${REQUEST_COLUMNS} FROM identity.admin_access_requests WHERE id = $1`,
      [id],
    );
    return rows[0] ? AdminAccessRequestMapper.toDomain(rows[0]) : null;
  }

  async findPendingByUserId(
    userId: string,
  ): Promise<AdminAccessRequest | null> {
    const rows = await this.dataSource.query<AdminAccessRequestOrmEntity[]>(
      `SELECT ${REQUEST_COLUMNS}
         FROM identity.admin_access_requests
        WHERE user_id = $1 AND status = $2`,
      [userId, AdminAccessRequestStatus.PENDING],
    );
    return rows[0] ? AdminAccessRequestMapper.toDomain(rows[0]) : null;
  }

  async save(request: AdminAccessRequest): Promise<void> {
    const changed = AdminAccessRequestMapper.toChangedColumns(request);
    try {
      await this.dataSource.transaction(async (manager) => {
        if (request.version === 0) {
          await manager.query(
            `INSERT INTO identity.admin_access_requests
               (id, user_id, reason, requested_at, version, status,
                decided_at, decided_by, decision_note)
             VALUES ($1, $2, $3, $4, 1, $5, $6, $7, $8)`,
            [
              request.id,
              request.userId,
              request.reason,
              request.requestedAt,
              changed.status,
              changed.decidedAt,
              changed.decidedBy,
              changed.decisionNote,
            ],
          );
        } else {
          // Compare-and-swap: two super-admin tabs can't both decide it.
          const [, affected] = await manager.query<[unknown, number]>(
            `UPDATE identity.admin_access_requests
                SET status        = $3,
                    decided_at    = $4,
                    decided_by    = $5,
                    decision_note = $6,
                    version       = version + 1
              WHERE id = $1 AND version = $2`,
            [
              request.id,
              request.version,
              changed.status,
              changed.decidedAt,
              changed.decidedBy,
              changed.decisionNote,
            ],
          );
          if (affected !== 1) {
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
