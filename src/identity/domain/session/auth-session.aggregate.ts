import { AggregateRoot } from '../../../shared/domain/aggregate-root';
import { constantTimeEquals } from '../../../shared/domain/constant-time-equals';
import {
  RefreshTokenReuseDetectedError,
  SessionExpiredError,
  SessionRevokedError,
} from '../errors/identity.errors';
import { RefreshTokenReuseDetected } from '../events/refresh-token-reuse-detected.event';
import { SessionRevoked } from '../events/session-revoked.event';
import { SessionStarted } from '../events/session-started.event';
import { SessionLifetime } from './session-lifetime.vo';
import { SessionRevocationReason } from './session-revocation-reason.enum';

export interface SessionDevice {
  deviceName: string | null;
  userAgent: string | null;
  ipAddress: string | null;
}

export interface AuthSessionProps extends SessionDevice {
  id: string;
  userId: string;
  /** Hash of the ONE refresh token currently valid for this session. */
  tokenHash: string;
  createdAt: Date;
  lastUsedAt: Date;
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
  revokedAt: Date | null;
  revokedReason: SessionRevocationReason | null;
  /** Optimistic-lock version as loaded from storage. 0 = never persisted. */
  version: number;
}

export interface StartSessionParams {
  id: string;
  userId: string;
  tokenHash: string;
  device: SessionDevice;
  lifetime: SessionLifetime;
  now: Date;
}

export interface RotateParams {
  presentedTokenHash: string;
  nextTokenHash: string;
  lifetime: SessionLifetime;
  now: Date;
}

/**
 * One login on one device (Identity context).
 *
 * The session is the refresh-token "family": every rotation replaces
 * tokenHash, so exactly one refresh token is valid at a time. Presenting
 * any other token for this session means a copy was taken -> the session
 * revokes itself. Other devices' sessions are untouched.
 *
 * Invariants:
 *  - a revoked session never becomes active again
 *  - lastUsedAt / idleExpiresAt never pass absoluteExpiresAt
 *  - only the current token hash can rotate the session
 */
export class AuthSession extends AggregateRoot {
  private constructor(private props: AuthSessionProps) {
    super();
  }

  static start(params: StartSessionParams): AuthSession {
    const { id, userId, tokenHash, device, lifetime, now } = params;
    const absoluteExpiresAt = new Date(now.getTime() + lifetime.absoluteTtlMs);

    const session = new AuthSession({
      id,
      userId,
      tokenHash,
      ...device,
      createdAt: now,
      lastUsedAt: now,
      idleExpiresAt: AuthSession.idleExpiry(now, lifetime, absoluteExpiresAt),
      absoluteExpiresAt,
      revokedAt: null,
      revokedReason: null,
      version: 0,
    });
    session.raise(
      new SessionStarted(id, userId, device.deviceName, device.ipAddress, now),
    );
    return session;
  }

  static rehydrate(props: AuthSessionProps): AuthSession {
    return new AuthSession({ ...props });
  }

  /**
   * Exchanges the current refresh token for the next one.
   *
   * Throws RefreshTokenReuseDetectedError AFTER revoking itself when the
   * presented token is not the current one. The caller must still save the
   * session in that case so the revocation sticks.
   */
  rotate(params: RotateParams): void {
    const { presentedTokenHash, nextTokenHash, lifetime, now } = params;

    this.assertActive(now);

    if (!this.matches(presentedTokenHash)) {
      this.markCompromised(now);
      throw new RefreshTokenReuseDetectedError();
    }

    this.props.tokenHash = nextTokenHash;
    this.props.lastUsedAt = now;
    this.props.idleExpiresAt = AuthSession.idleExpiry(
      now,
      lifetime,
      this.props.absoluteExpiresAt,
    );
  }

  /**
   * Logout from this device. A stale token still ends the session, but is
   * recorded as reuse, because whoever sent it should not have had it.
   */
  logout(presentedTokenHash: string, now: Date): void {
    if (this.props.revokedAt) return;
    if (this.matches(presentedTokenHash)) {
      this.revoke(SessionRevocationReason.LOGOUT, now);
    } else {
      this.markCompromised(now);
    }
  }

  /** Idempotent: revoking a revoked session changes nothing. */
  revoke(reason: SessionRevocationReason, now: Date): void {
    if (this.props.revokedAt) return;
    this.props.revokedAt = now;
    this.props.revokedReason = reason;
    this.raise(new SessionRevoked(this.id, this.userId, reason, now));
  }

  /**
   * A copy of a refresh token for this session is in someone else's hands
   * (replayed old token, or two parties racing the same token). Kill it.
   */
  markCompromised(now: Date): void {
    if (this.props.revokedAt) return;
    this.raise(new RefreshTokenReuseDetected(this.id, this.userId, now));
    this.revoke(SessionRevocationReason.REUSE_DETECTED, now);
  }

  isActive(now: Date): boolean {
    return (
      this.props.revokedAt === null &&
      now < this.props.idleExpiresAt &&
      now < this.props.absoluteExpiresAt
    );
  }

  belongsTo(userId: string): boolean {
    return this.props.userId === userId;
  }

  /** When the current refresh token stops working (for the cookie's Max-Age). */
  get refreshTokenExpiresAt(): Date {
    return this.props.idleExpiresAt;
  }

  get id(): string {
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get tokenHash(): string {
    return this.props.tokenHash;
  }
  get deviceName(): string | null {
    return this.props.deviceName;
  }
  get userAgent(): string | null {
    return this.props.userAgent;
  }
  get ipAddress(): string | null {
    return this.props.ipAddress;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get lastUsedAt(): Date {
    return this.props.lastUsedAt;
  }
  get idleExpiresAt(): Date {
    return this.props.idleExpiresAt;
  }
  get absoluteExpiresAt(): Date {
    return this.props.absoluteExpiresAt;
  }
  get revokedAt(): Date | null {
    return this.props.revokedAt;
  }
  get revokedReason(): SessionRevocationReason | null {
    return this.props.revokedReason;
  }
  get version(): number {
    return this.props.version;
  }

  private assertActive(now: Date): void {
    if (this.props.revokedAt) throw new SessionRevokedError();
    if (!this.isActive(now)) throw new SessionExpiredError();
  }

  private matches(presentedTokenHash: string): boolean {
    return constantTimeEquals(presentedTokenHash, this.props.tokenHash);
  }

  private static idleExpiry(
    now: Date,
    lifetime: SessionLifetime,
    absoluteExpiresAt: Date,
  ): Date {
    const idle = now.getTime() + lifetime.idleTtlMs;
    return new Date(Math.min(idle, absoluteExpiresAt.getTime()));
  }
}
