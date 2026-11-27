import { Module } from '@nestjs/common';
import { CatalogInfraModule } from '../../infra/catalog-infra.module';
import { GetTheatreController } from './get-theatre.controller';
import { GetTheatreHandler } from './get-theatre.handler';

@Module({
  imports: [CatalogInfraModule],
  controllers: [GetTheatreController],
  providers: [GetTheatreHandler],
})
export class GetTheatreModule {}
