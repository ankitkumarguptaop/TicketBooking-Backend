import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { HealthModule } from './features/health/health.module';
import { DatabaseModule } from './infra/database/database.module';
import { DomainErrorFilter } from './infra/http/domain-error.filter';

/** Cross-cutting setup every context relies on: config, CQRS buses, DB, errors. */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CqrsModule.forRoot(),
    DatabaseModule,
    HealthModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: DomainErrorFilter }],
})
export class SharedModule {}
