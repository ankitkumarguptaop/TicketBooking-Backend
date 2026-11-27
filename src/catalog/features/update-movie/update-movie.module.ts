import { Module } from '@nestjs/common';
import { CatalogInfraModule } from '../../infra/catalog-infra.module';
import { UpdateMovieController } from './update-movie.controller';

@Module({
  imports: [CatalogInfraModule],
  controllers: [UpdateMovieController],
  // TODO(you): update-movie.handler.ts -> providers: [UpdateMovieHandler]
  providers: [],
})
export class UpdateMovieModule {}
