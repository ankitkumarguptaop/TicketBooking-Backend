import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConcurrentSessionUpdateError } from '../../domain/errors/identity.errors';
import { AuthSession } from '../../domain/session/auth-session.aggregate';
import { AuthSessionRepository } from '../../domain/ports/auth-session.repository';
import { AuthSessionMapper } from '../mappers/auth-session.mapper';
import { AuthSessionOrmEntity } from '../entities/auth-session.orm-entity';
import { appendToOutbox } from '../messaging/outbox-writer';
import { OutboxRelay } from '../messaging/outbox-relay.service';

/** Aliased to the AuthSessionOrmEntity field names, so the mapper reads rows as-is. */
const SESSION_COLUMNS = `
  id, user_id AS "userId", token_hash AS "tokenHash", device_name AS "deviceName",
  user_agent AS "userAgent", ip_address AS "ipAddress", created_at AS "createdAt",
  last_used_at AS "lastUsedAt", idle_expires_at AS "idleExpiresAt",
  absolute_expires_at AS "absoluteExpiresAt", revoked_at AS "revokedAt",
  revoked_reason AS "revokedReason", version
`;

@Injectable()
export class TypeOrmAuthSessionRepository implements AuthSessionRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly outbox: OutboxRelay,
  ) {}

  async findById(id: string): Promise<AuthSession | null> {
    const rows = await this.dataSource.query<AuthSessionOrmEntity[]>(
      `SELECT ${SESSION_COLUMNS} FROM identity.user_sessions WHERE id = $1`,
      [id],
    );
    return rows[0] ? AuthSessionMapper.toDomain(rows[0]) : null;
  }

  async findActiveByUserId(userId: string, now: Date): Promise<AuthSession[]> {
    const rows = await this.dataSource.query<AuthSessionOrmEntity[]>(
      `SELECT ${SESSION_COLUMNS}
         FROM identity.user_sessions
        WHERE user_id = $1
          AND revoked_at IS NULL
          AND idle_expires_at > $2
          AND absolute_expires_at > $2
        ORDER BY last_used_at DESC`,
      [userId, now],
    );
    return rows.map((row) => AuthSessionMapper.toDomain(row));
  }

  async save(session: AuthSession): Promise<void> {
    const changed = AuthSessionMapper.toChangedColumns(session);

    // The row and its events commit together (transactional outbox).
    await this.dataSource.transaction(async (manager) => {
      if (session.version === 0) {
        await manager.query(
          `INSERT INTO identity.user_sessions
             (id, user_id, created_at, version, token_hash, device_name,
              user_agent, ip_address, last_used_at, idle_expires_at,
              absolute_expires_at, revoked_at, revoked_reason)
           VALUES ($1, $2, $3, 1, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            session.id,
            session.userId,
            session.createdAt,
            changed.tokenHash,
            changed.deviceName,
            changed.userAgent,
            changed.ipAddress,
            changed.lastUsedAt,
            changed.idleExpiresAt,
            changed.absoluteExpiresAt,
            changed.revokedAt,
            changed.revokedReason,
          ],
        );
      } else {
        // Compare-and-swap: only succeeds if nobody saved since we loaded it.
        const [, affected] = await manager.query<[unknown, number]>(
          `UPDATE identity.user_sessions
              SET token_hash          = $3,
                  device_name         = $4,
                  user_agent          = $5,
                  ip_address          = $6,
                  last_used_at        = $7,
                  idle_expires_at     = $8,
                  absolute_expires_at = $9,
                  revoked_at          = $10,
                  revoked_reason      = $11,
                  version             = version + 1
            WHERE id = $1 AND version = $2`,
          [
            session.id,
            session.version,
            changed.tokenHash,
            changed.deviceName,
            changed.userAgent,
            changed.ipAddress,
            changed.lastUsedAt,
            changed.idleExpiresAt,
            changed.absoluteExpiresAt,
            changed.revokedAt,
            changed.revokedReason,
          ],
        );
        if (affected !== 1) {
          throw new ConcurrentSessionUpdateError(session.id);
        }
      }
      await appendToOutbox(manager, session.pullDomainEvents());
    });
    this.outbox.nudge();
  }
}
