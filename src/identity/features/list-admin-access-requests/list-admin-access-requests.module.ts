import { Module } from '@nestjs/common';
import { IdentityInfraModule } from '../../infra/identity-infra.module';
import { ListAdminAccessRequestsController } from './list-admin-access-requests.controller';
import { ListAdminAccessRequestsHandler } from './list-admin-access-requests.handler';

@Module({
  imports: [IdentityInfraModule],
  controllers: [ListAdminAccessRequestsController],
  providers: [ListAdminAccessRequestsHandler],
})
export class ListAdminAccessRequestsModule {}
