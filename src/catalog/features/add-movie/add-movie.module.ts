import { Module } from '@nestjs/common';
import { CatalogInfraModule } from '../../infra/catalog-infra.module';
import { AddMovieController } from './add-movie.controller';

@Module({
  imports: [CatalogInfraModule],
  controllers: [AddMovieController],
  // TODO(you): add-movie.handler.ts -> providers: [AddMovieHandler]
  providers: [],
})
export class AddMovieModule {}
