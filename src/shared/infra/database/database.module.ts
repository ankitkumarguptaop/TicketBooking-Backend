import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildTypeOrmOptions } from './typeorm-options';

/** dist/ at runtime (this file compiles to dist/shared/infra/database/). */
const DIST_ROOT = join(__dirname, '..', '..', '..');

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...buildTypeOrmOptions((key) => config.get<string>(key), {
          // every context's compiled migrations
          migrations: [`${DIST_ROOT}/*/infra/persistence/migrations/*.js`],
        }),
        autoLoadEntities: true,
        // DB_MIGRATIONS_RUN=true applies pending migrations on boot (handy in
        // dev/containers). In CI/prod prefer an explicit `npm run migration:run`.
        migrationsRun: config.get<string>('DB_MIGRATIONS_RUN') === 'true',
      }),
    }),
  ],
})
export class DatabaseModule {}
