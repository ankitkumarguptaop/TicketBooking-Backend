import * as net from 'node:net';
import { join } from 'node:path';
import { ConfigService } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';

/**
 * Node 20 tries each resolved IP for only 250 ms ("happy eyeballs") before
 * moving on. A remote DB with higher latency (e.g. Neon us-east-2 from India)
 * then fails with ETIMEDOUT on every address. Give each attempt 5 s.
 * Called by the app, the migration CLI and the seed CLI.
 */
export function relaxConnectAttemptTimeout(): void {
  net.setDefaultAutoSelectFamilyAttemptTimeout(5_000);
}

/** Bounded context -> its Postgres schema (same name, CLAUDE.md §Database). */
const CONTEXT_SCHEMAS = {
  identity: 'identity',
  catalog: 'catalog',
  venue: 'venue',
  scheduling: 'scheduling',
  booking: 'booking',
  payment: 'payment',
  notification: 'notification',
  review: 'review',
} as const;

export type ContextName = keyof typeof CONTEXT_SCHEMAS;

/**
 * src/ when run through ts-node (migration CLI, seed script),
 * dist/ when run compiled (the app). This file lives in shared/infra/database/.
 */
const ROOT = join(__dirname, '..', '..', '..');
const EXT = __filename.endsWith('.ts') ? 'ts' : 'js';

/**
 * TypeORM options for one bounded context, or for all of them ('default').
 *
 *   typeOrmConfig('identity')  -> only identity's entities + migrations
 *   typeOrmConfig()            -> every context (what the app uses)
 *
 * Each context keeps them in src/<context>/infra/entities/ and
 * src/<context>/infra/migrations/; its migrations touch only its schema.
 */
export default function typeOrmConfig(
  contextName: ContextName | 'default' = 'default',
): DataSourceOptions {
  if (contextName !== 'default' && !(contextName in CONTEXT_SCHEMAS)) {
    throw new Error(
      `Unknown context "${String(contextName)}". Use one of: default, ${Object.keys(CONTEXT_SCHEMAS).join(', ')}`,
    );
  }
  const config = new ConfigService();
  const moduleName = contextName === 'default' ? '*' : contextName;
  const infra = `${ROOT}/${moduleName}/infra`;

  const common = {
    type: 'postgres' as const,
    entities: [`${infra}/entities/*.orm-entity.${EXT}`],
    migrations: [`${infra}/migrations/*.${EXT}`],
    // One shared history table (public.migrations). Not per-schema: TypeORM
    // creates it before any migration runs, i.e. before CREATE SCHEMA.
    migrationsTableName: 'migrations',
    // One transaction per migration: a failing migration leaves no half-applied state.
    migrationsTransactionMode: 'each' as const,
    // Schema changes only through migrations. `true` is a dev-only escape hatch.
    synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true',
    extra: { connectionTimeoutMillis: 10_000 },
  };

  // Hosted Postgres (e.g. Neon): one connection string, TLS required.
  const url = config.get<string>('DATABASE_URL');
  if (url) {
    return { ...common, url, ssl: { rejectUnauthorized: true } };
  }

  // Local docker-compose Postgres.
  return {
    ...common,
    host: config.get<string>('DB_HOST', 'localhost'),
    port: Number(config.get<string>('DB_PORT', '5432')),
    username: config.getOrThrow<string>('DB_USER'),
    password: config.getOrThrow<string>('DB_PASSWORD'),
    database: config.getOrThrow<string>('DB_NAME'),
  };
}
