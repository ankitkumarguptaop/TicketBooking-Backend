import { Module } from '@nestjs/common';
import { IdentityInfraModule } from '../../infra/identity-infra.module';
import { ApproveAdminAccessRequestController } from './approve-admin-access-request.controller';
import { ApproveAdminAccessRequestHandler } from './approve-admin-access-request.handler';

@Module({
  imports: [IdentityInfraModule],
  controllers: [ApproveAdminAccessRequestController],
  providers: [ApproveAdminAccessRequestHandler],
})
export class ApproveAdminAccessRequestModule {}
