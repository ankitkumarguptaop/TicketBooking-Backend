import { Module } from '@nestjs/common';
import { CatalogInfraModule } from '../../infra/catalog-infra.module';
import { DeleteMovieController } from './delete-movie.controller';

@Module({
  imports: [CatalogInfraModule],
  controllers: [DeleteMovieController],
  // TODO(you): delete-movie.handler.ts -> providers: [DeleteMovieHandler]
  providers: [],
})
export class DeleteMovieModule {}
