import { Module } from '@nestjs/common';
import { CatalogInfraModule } from '../../infra/catalog-infra.module';
import { AutoScheduleShowsController } from './auto-schedule-shows.controller';

@Module({
  imports: [CatalogInfraModule],
  controllers: [AutoScheduleShowsController],
  // TODO(you): auto-schedule-shows.handler.ts -> providers: [AutoScheduleShowsHandler]
  providers: [],
})
export class AutoScheduleShowsModule {}
