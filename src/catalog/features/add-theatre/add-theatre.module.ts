import { Module } from '@nestjs/common';
import { CatalogInfraModule } from '../../infra/catalog-infra.module';
import { AddTheatreController } from './add-theatre.controller';

@Module({
  imports: [CatalogInfraModule],
  controllers: [AddTheatreController],
  // TODO(you): add-theatre.handler.ts -> providers: [AddTheatreHandler]
  providers: [],
})
export class AddTheatreModule {}
