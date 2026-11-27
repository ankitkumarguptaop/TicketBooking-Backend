import { Module } from '@nestjs/common';
import { CatalogInfraModule } from '../../infra/catalog-infra.module';
import { AddScreenController } from './add-screen.controller';

@Module({
  imports: [CatalogInfraModule],
  controllers: [AddScreenController],
  // TODO(you): add-screen.handler.ts -> providers: [AddScreenHandler]
  providers: [],
})
export class AddScreenModule {}
