import { Module } from '@nestjs/common';
import { CatalogInfraModule } from '../../infra/catalog-infra.module';
import { ListTheatresController } from './list-theatres.controller';
import { ListTheatresHandler } from './list-theatres.handler';

@Module({
  imports: [CatalogInfraModule],
  controllers: [ListTheatresController],
  providers: [ListTheatresHandler],
})
export class ListTheatresModule {}
