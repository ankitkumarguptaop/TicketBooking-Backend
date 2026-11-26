import { Module } from '@nestjs/common';
import { IdentityInfraModule } from '../../infra/identity-infra.module';
import { RejectAdminAccessRequestController } from './reject-admin-access-request.controller';
import { RejectAdminAccessRequestHandler } from './reject-admin-access-request.handler';

@Module({
  imports: [IdentityInfraModule],
  controllers: [RejectAdminAccessRequestController],
  providers: [RejectAdminAccessRequestHandler],
})
export class RejectAdminAccessRequestModule {}
