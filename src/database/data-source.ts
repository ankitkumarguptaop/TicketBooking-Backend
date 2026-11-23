import 'dotenv/config';
import { DataSource } from 'typeorm';
import {
  buildTypeOrmOptions,
  relaxConnectAttemptTimeout,
} from './typeorm-options';

/**
 * Used ONLY by the TypeORM CLI (npm run migration:*), never by the app.
 * Runs from TypeScript sources via ts-node.
 */
relaxConnectAttemptTimeout();

export default new DataSource(
  buildTypeOrmOptions((key) => process.env[key], {
    entities: ['src/*/infrastructure/persistence/*.orm-entity.ts'],
    migrations: ['src/*/infrastructure/persistence/migrations/*.ts'],
  }),
);
