import { Module } from '@nestjs/common';
import { CatalogInfraModule } from '../../infra/catalog-infra.module';
import { GetScreenLayoutController } from './get-screen-layout.controller';
import { GetScreenLayoutHandler } from './get-screen-layout.handler';

@Module({
  imports: [CatalogInfraModule],
  controllers: [GetScreenLayoutController],
  providers: [GetScreenLayoutHandler],
})
export class GetScreenLayoutModule {}
