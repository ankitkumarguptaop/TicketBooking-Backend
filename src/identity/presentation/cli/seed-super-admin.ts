import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { CommandBus } from '@nestjs/cqrs';
import { AppModule } from '../../../app.module';
import { relaxConnectAttemptTimeout } from '../../../database/typeorm-options';
import { SeedSuperAdminCommand } from '../../application/commands/seed-super-admin/seed-super-admin.command';
import { SeedSuperAdminResult } from '../../application/commands/seed-super-admin/seed-super-admin.handler';

/**
 * Creates the one SUPER_ADMIN from environment variables:
 *   SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD (min 12 chars),
 *   SUPER_ADMIN_FULL_NAME, SUPER_ADMIN_PHONE
 *
 *   npm run seed:super-admin            (dev, from TypeScript)
 *   npm run seed:super-admin:prod       (after npm run build)
 *
 * Idempotent: if a super admin exists, it prints that and changes nothing.
 * Runs the app's real use case (same hashing, validation, outbox) through a
 * Nest application context, with no HTTP server.
 */
const MIN_PASSWORD_LENGTH = 12;
const logger = new Logger('SeedSuperAdmin');

function env(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) throw new Error(`Missing env var ${key}`);
  return value;
}

async function main(): Promise<void> {
  relaxConnectAttemptTimeout();
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  try {
    // ConfigModule has loaded .env by now.
    const password = env('SUPER_ADMIN_PASSWORD');
    if (password.length < MIN_PASSWORD_LENGTH || password.length > 72) {
      throw new Error(
        `SUPER_ADMIN_PASSWORD must be ${MIN_PASSWORD_LENGTH}-72 characters`,
      );
    }
    const result = await app
      .get(CommandBus)
      .execute<SeedSuperAdminCommand, SeedSuperAdminResult>(
        new SeedSuperAdminCommand(
          env('SUPER_ADMIN_EMAIL'),
          password,
          env('SUPER_ADMIN_FULL_NAME'),
          env('SUPER_ADMIN_PHONE'),
        ),
      );
    if (result.outcome === 'CREATED') {
      logger.log(`Super admin created (id ${result.userId})`);
    } else {
      logger.log('A super admin already exists; nothing changed');
    }
  } finally {
    await app.close();
  }
}

main().catch((err: unknown) => {
  logger.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
