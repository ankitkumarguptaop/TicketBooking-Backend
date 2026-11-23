import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { buildTypeOrmOptions } from './database/typeorm-options';
import { IdentityModule } from './identity/identity.module';
import { DomainErrorFilter } from './shared/presentation/domain-error.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CqrsModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...buildTypeOrmOptions((key) => config.get<string>(key), {
          // compiled migrations; __dirname is dist/ at runtime
          migrations: [
            `${__dirname}/*/infrastructure/persistence/migrations/*.js`,
          ],
        }),
        autoLoadEntities: true,
        // DB_MIGRATIONS_RUN=true applies pending migrations on boot (handy in
        // dev/containers). In CI/prod prefer an explicit `npm run migration:run`.
        migrationsRun: config.get<string>('DB_MIGRATIONS_RUN') === 'true',
      }),
    }),
    IdentityModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_FILTER, useClass: DomainErrorFilter }],
})
export class AppModule {}
