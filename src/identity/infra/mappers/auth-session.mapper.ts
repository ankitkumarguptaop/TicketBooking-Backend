import { AuthSession } from '../../domain/session/auth-session.aggregate';
import { AuthSessionOrmEntity } from './auth-session.orm-entity';

export class AuthSessionMapper {
  static toDomain(row: AuthSessionOrmEntity): AuthSession {
    return AuthSession.rehydrate({
      id: row.id,
      userId: row.userId,
      tokenHash: row.tokenHash,
      deviceName: row.deviceName,
      userAgent: row.userAgent,
      ipAddress: row.ipAddress,
      createdAt: row.createdAt,
      lastUsedAt: row.lastUsedAt,
      idleExpiresAt: row.idleExpiresAt,
      absoluteExpiresAt: row.absoluteExpiresAt,
      revokedAt: row.revokedAt,
      revokedReason: row.revokedReason,
      version: row.version,
    });
  }

  /** Mutable columns only (everything except id, userId, createdAt, version). */
  static toChangedColumns(
    session: AuthSession,
  ): Omit<AuthSessionOrmEntity, 'id' | 'userId' | 'createdAt' | 'version'> {
    return {
      tokenHash: session.tokenHash,
      deviceName: session.deviceName,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      lastUsedAt: session.lastUsedAt,
      idleExpiresAt: session.idleExpiresAt,
      absoluteExpiresAt: session.absoluteExpiresAt,
      revokedAt: session.revokedAt,
      revokedReason: session.revokedReason,
    };
  }
}
