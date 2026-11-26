import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import typeOrmConfig from './typeorm.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...typeOrmConfig('default'),
        autoLoadEntities: true,
        // DB_MIGRATIONS_RUN=true applies pending migrations on boot (handy in
        // dev/containers). In CI/prod prefer an explicit `npm run migration:run`.
        migrationsRun: config.get<string>('DB_MIGRATIONS_RUN') === 'true',
      }),
    }),
  ],
})
export class DatabaseModule {}
