import { Module } from '@nestjs/common';
import { CatalogInfraModule } from '../../infra/catalog-infra.module';
import { ScheduleShowController } from './schedule-show.controller';

@Module({
  imports: [CatalogInfraModule],
  controllers: [ScheduleShowController],
  // TODO(you): schedule-show.handler.ts -> providers: [ScheduleShowHandler]
  providers: [],
})
export class ScheduleShowModule {}
