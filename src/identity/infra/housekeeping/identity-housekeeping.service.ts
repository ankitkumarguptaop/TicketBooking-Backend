import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

const DAY_MS = 24 * 60 * 60 * 1000;
/** First run shortly after boot, not during it. */
const FIRST_RUN_DELAY_MS = 60_000;
/** Any number works: it only has to be the same in every instance. */
const ADVISORY_LOCK_KEY = 7_340_001;

/**
 * Deletes identity rows that no longer do anything:
 *  - sessions dead (revoked or expired) for more than SESSION_RETENTION_DAYS
 *    (default 30; kept that long for "where was I signed in" support questions)
 *  - verification / reset codes expired more than 7 days ago
 *  - outbox rows published more than OUTBOX_RETENTION_DAYS ago (default 7)
 *
 * Runs every HOUSEKEEPING_INTERVAL_MINUTES (default 360). With several API
 * instances, a Postgres advisory lock lets only one of them do a run.
 * Deletes are idempotent, so a missed or doubled run is harmless.
 *
 * In Phase 3 this can move to a RabbitMQ-scheduled job; the SQL stays.
 */
@Injectable()
export class IdentityHousekeeping
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(IdentityHousekeeping.name);
  private readonly intervalMs: number;
  private readonly sessionRetentionMs: number;
  private readonly codeRetentionMs = 7 * DAY_MS;
  private readonly outboxRetentionMs: number;
  private timers: NodeJS.Timeout[] = [];

  constructor(
    private readonly dataSource: DataSource,
    config: ConfigService,
  ) {
    this.intervalMs =
      Number(config.get('HOUSEKEEPING_INTERVAL_MINUTES', 360)) * 60_000;
    this.sessionRetentionMs =
      Number(config.get('SESSION_RETENTION_DAYS', 30)) * DAY_MS;
    this.outboxRetentionMs =
      Number(config.get('OUTBOX_RETENTION_DAYS', 7)) * DAY_MS;
  }

  onApplicationBootstrap(): void {
    if (this.intervalMs <= 0) return; // 0 disables it (e.g. in tests)
    const first = setTimeout(() => void this.run(), FIRST_RUN_DELAY_MS);
    const every = setInterval(() => void this.run(), this.intervalMs);
    first.unref();
    every.unref();
    this.timers = [first, every];
  }

  onModuleDestroy(): void {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
  }

  /** One pass. Public so it can be triggered by hand or from a test. */
  async run(now = new Date()): Promise<void> {
    try {
      await this.dataSource.transaction(async (manager) => {
        // Transaction-scoped: released automatically on commit/rollback.
        const [{ locked }] = await manager.query<{ locked: boolean }[]>(
          'SELECT pg_try_advisory_xact_lock($1) AS locked',
          [ADVISORY_LOCK_KEY],
        );
        if (!locked) return; // another instance is on it

        const sessionsBefore = new Date(
          now.getTime() - this.sessionRetentionMs,
        );
        const codesBefore = new Date(now.getTime() - this.codeRetentionMs);
        const outboxBefore = new Date(now.getTime() - this.outboxRetentionMs);

        // "Dead since" = the earliest of revoked, idle-expired, absolute-expired.
        const [, sessions] = await manager.query<[unknown, number]>(
          `DELETE FROM identity.user_sessions
            WHERE LEAST(COALESCE(revoked_at, 'infinity'), idle_expires_at, absolute_expires_at) < $1`,
          [sessionsBefore],
        );
        const [, codes] = await manager.query<[unknown, number]>(
          `DELETE FROM identity.verification_codes WHERE expires_at < $1`,
          [codesBefore],
        );
        const [, outbox] = await manager.query<[unknown, number]>(
          `DELETE FROM identity.outbox WHERE published_at < $1`,
          [outboxBefore],
        );

        this.logger.log(
          `Deleted ${sessions} sessions, ${codes} codes, ${outbox} outbox rows`,
        );
      });
    } catch (err) {
      this.logger.error('Housekeeping run failed', err);
    }
  }
}
