import { Module } from '@nestjs/common';
import { CatalogInfraModule } from '../../infra/catalog-infra.module';
import { CancelShowController } from './cancel-show.controller';

@Module({
  imports: [CatalogInfraModule],
  controllers: [CancelShowController],
  // TODO(you): cancel-show.handler.ts -> providers: [CancelShowHandler]
  providers: [],
})
export class CancelShowModule {}
