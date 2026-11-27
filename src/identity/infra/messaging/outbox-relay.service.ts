import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventBus } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { deserializeEvent } from './identity-event-registry';

const BATCH_SIZE = 100;
/** After this many failed publishes a row is left for a human to look at. */
const MAX_ATTEMPTS = 10;

interface PendingRow {
  id: string;
  eventType: string;
  payload: object;
}

/**
 * Moves events from identity.outbox to the event bus.
 *
 *  - Polls every OUTBOX_POLL_INTERVAL_MS (default 1 s), and also right after
 *    a repository commits (`nudge()`), so live features such as the
 *    session-revoked SSE stay instant.
 *  - Each batch runs in one transaction with FOR UPDATE SKIP LOCKED, so two
 *    API instances never publish the same row at the same time.
 *  - Delivery is AT LEAST ONCE: if the process dies after publishing but
 *    before the commit, the row is published again. Consumers must be
 *    idempotent (each event carries its original eventId).
 *
 * Today the bus is in-process (@nestjs/cqrs). In Phase 5 only publish()
 * changes, to RabbitMQ; the table and the transaction stay as they are.
 */
@Injectable()
export class OutboxRelay implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(OutboxRelay.name);
  private readonly intervalMs: number;
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private rerun = false;

  constructor(
    private readonly dataSource: DataSource,
    private readonly eventBus: EventBus,
    config: ConfigService,
  ) {
    this.intervalMs = Number(config.get('OUTBOX_POLL_INTERVAL_MS', 1000));
  }

  onApplicationBootstrap(): void {
    this.timer = setInterval(() => this.nudge(), this.intervalMs);
    this.timer.unref();
    this.nudge();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /** Publish pending events soon. Safe to call often: runs never overlap. */
  nudge(): void {
    if (this.running) {
      this.rerun = true;
      return;
    }
    this.running = true;
    void this.drain()
      .catch((err) => this.logger.error('Outbox relay run failed', err))
      .finally(() => {
        this.running = false;
        if (this.rerun) {
          this.rerun = false;
          this.nudge();
        }
      });
  }

  /** Publishes batches until nothing is pending. */
  private async drain(): Promise<void> {
    while ((await this.publishBatch()) === BATCH_SIZE) {
      // a full batch: there may be more
    }
  }

  private publishBatch(): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      const rows = await manager.query<PendingRow[]>(
        `SELECT id, event_type AS "eventType", payload
           FROM identity.outbox
          WHERE published_at IS NULL
            AND attempts < $1
          ORDER BY occurred_at ASC
          LIMIT $2
            FOR UPDATE SKIP LOCKED`,
        [MAX_ATTEMPTS, BATCH_SIZE],
      );

      const now = new Date();
      for (const row of rows) {
        try {
          this.eventBus.publish(deserializeEvent(row.eventType, row.payload));
          await manager.query(
            `UPDATE identity.outbox
                SET published_at = $2, last_error = NULL
              WHERE id = $1`,
            [row.id, now],
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          this.logger.error(`Outbox event ${row.id} failed: ${message}`);
          await manager.query(
            `UPDATE identity.outbox
                SET attempts = attempts + 1, last_error = $2
              WHERE id = $1`,
            [row.id, message.slice(0, 2000)],
          );
        }
      }
      return rows.length;
    });
  }
}
