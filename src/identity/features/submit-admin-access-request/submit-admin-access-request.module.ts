import { Module } from '@nestjs/common';
import { IdentityInfraModule } from '../../infra/identity-infra.module';
import { SubmitAdminAccessRequestController } from './submit-admin-access-request.controller';
import { SubmitAdminAccessRequestHandler } from './submit-admin-access-request.handler';

@Module({
  imports: [IdentityInfraModule],
  controllers: [SubmitAdminAccessRequestController],
  providers: [SubmitAdminAccessRequestHandler],
})
export class SubmitAdminAccessRequestModule {}
