import { Module } from '@nestjs/common';
import { CatalogInfraModule } from '../../infra/catalog-infra.module';
import { SetScreenLayoutController } from './set-screen-layout.controller';

@Module({
  imports: [CatalogInfraModule],
  controllers: [SetScreenLayoutController],
  // TODO(you): set-screen-layout.handler.ts -> providers: [SetScreenLayoutHandler]
  providers: [],
})
export class SetScreenLayoutModule {}
