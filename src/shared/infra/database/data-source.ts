import 'dotenv/config';
import { DataSource } from 'typeorm';
import typeOrmConfig, {
  ContextName,
  relaxConnectAttemptTimeout,
} from './typeorm.config';

/**
 * Used ONLY by the TypeORM CLI (npm run migration:*), never by the app.
 * Runs from TypeScript sources via ts-node.
 *
 * DB_CONTEXT picks one bounded context; unset means all of them:
 *   npm run migration:run                       every context
 *   DB_CONTEXT=identity npm run migration:run   identity only
 */
relaxConnectAttemptTimeout();

export default new DataSource(
  typeOrmConfig((process.env.DB_CONTEXT as ContextName) || 'default'),
);
