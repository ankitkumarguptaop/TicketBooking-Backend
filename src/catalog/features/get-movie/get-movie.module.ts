import { Module } from '@nestjs/common';
import { CatalogInfraModule } from '../../infra/catalog-infra.module';
import { GetMovieController } from './get-movie.controller';
import { GetMovieHandler } from './get-movie.handler';

@Module({
  imports: [CatalogInfraModule],
  controllers: [GetMovieController],
  providers: [GetMovieHandler],
})
export class GetMovieModule {}
