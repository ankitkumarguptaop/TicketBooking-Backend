import { Module } from '@nestjs/common';
import { CatalogInfraModule } from '../../infra/catalog-infra.module';
import { GetShowController } from './get-show.controller';
import { GetShowHandler } from './get-show.handler';

@Module({
  imports: [CatalogInfraModule],
  controllers: [GetShowController],
  providers: [GetShowHandler],
})
export class GetShowModule {}
