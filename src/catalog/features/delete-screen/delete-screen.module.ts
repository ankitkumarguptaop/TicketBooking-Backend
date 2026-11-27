import { Module } from '@nestjs/common';
import { CatalogInfraModule } from '../../infra/catalog-infra.module';
import { DeleteScreenController } from './delete-screen.controller';

@Module({
  imports: [CatalogInfraModule],
  controllers: [DeleteScreenController],
  // TODO(you): delete-screen.handler.ts -> providers: [DeleteScreenHandler]
  providers: [],
})
export class DeleteScreenModule {}
