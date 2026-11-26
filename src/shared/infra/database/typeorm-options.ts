import * as net from 'node:net';
import { DataSourceOptions } from 'typeorm';

/**
 * Node 20 tries each resolved IP for only 250 ms ("happy eyeballs") before
 * moving on. A remote DB with higher latency (e.g. Neon us-east-2 from India)
 * then fails with ETIMEDOUT on every address. Give each attempt 5 s.
 * Called by both the app and the migration CLI.
 */
export function relaxConnectAttemptTimeout(): void {
  net.setDefaultAutoSelectFamilyAttemptTimeout(5_000);
}

type Env = (key: string) => string | undefined;

function required(env: Env, key: string): string {
  const value = env(key);
  if (!value) throw new Error(`Missing required env var ${key}`);
  return value;
}

/**
 * Connection + migration settings shared by the Nest app (AppModule) and the
 * TypeORM CLI (data-source.ts), so both always talk to the same database
 * the same way.
 *
 * Each bounded context keeps its own migrations next to its persistence code:
 *   src/<context>/infra/persistence/migrations/*.ts
 * and a context's migrations only ever touch its own schema.
 */
export function buildTypeOrmOptions(
  env: Env,
  paths: { migrations: string[]; entities?: string[] },
): DataSourceOptions {
  const common = {
    type: 'postgres' as const,
    entities: paths.entities ?? [],
    migrations: paths.migrations,
    migrationsTableName: 'migrations',
    // One transaction per migration: a failing migration leaves no half-applied state.
    migrationsTransactionMode: 'each' as const,
    // Schema changes only through migrations. `true` is a dev-only escape hatch.
    synchronize: env('DB_SYNCHRONIZE') === 'true',
    extra: { connectionTimeoutMillis: 10_000 },
  };

  // Hosted Postgres (e.g. Neon): one connection string, TLS required.
  const url = env('DATABASE_URL');
  if (url) {
    return { ...common, url, ssl: { rejectUnauthorized: true } };
  }

  // Local docker-compose Postgres.
  return {
    ...common,
    host: env('DB_HOST') ?? 'localhost',
    port: Number(env('DB_PORT') ?? 5432),
    username: required(env, 'DB_USER'),
    password: required(env, 'DB_PASSWORD'),
    database: required(env, 'DB_NAME'),
  };
}
