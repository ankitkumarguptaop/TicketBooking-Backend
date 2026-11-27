import { Module } from '@nestjs/common';
import { CatalogInfraModule } from '../../infra/catalog-infra.module';
import { ListMoviesController } from './list-movies.controller';
import { ListMoviesHandler } from './list-movies.handler';

@Module({
  imports: [CatalogInfraModule],
  controllers: [ListMoviesController],
  providers: [ListMoviesHandler],
})
export class ListMoviesModule {}
