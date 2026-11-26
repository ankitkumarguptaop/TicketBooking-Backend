import { Module } from '@nestjs/common';
import { IdentityInfraModule } from '../../infra/identity-infra.module';
import { ListMySessionsController } from './list-my-sessions.controller';
import { ListMySessionsHandler } from './list-my-sessions.handler';

@Module({
  imports: [IdentityInfraModule],
  controllers: [ListMySessionsController],
  providers: [ListMySessionsHandler],
})
export class ListMySessionsModule {}
