import { Module } from '@nestjs/common';
import { CatalogInfraModule } from '../../infra/catalog-infra.module';
import { ListShowsController } from './list-shows.controller';
import { ListShowsHandler } from './list-shows.handler';

@Module({
  imports: [CatalogInfraModule],
  controllers: [ListShowsController],
  providers: [ListShowsHandler],
})
export class ListShowsModule {}
