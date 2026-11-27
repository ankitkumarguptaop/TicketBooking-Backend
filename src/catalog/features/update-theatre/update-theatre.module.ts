import { Module } from '@nestjs/common';
import { CatalogInfraModule } from '../../infra/catalog-infra.module';
import { UpdateTheatreController } from './update-theatre.controller';

@Module({
  imports: [CatalogInfraModule],
  controllers: [UpdateTheatreController],
  // TODO(you): update-theatre.handler.ts -> providers: [UpdateTheatreHandler]
  providers: [],
})
export class UpdateTheatreModule {}
