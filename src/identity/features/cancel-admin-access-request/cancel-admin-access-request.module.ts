import { Module } from '@nestjs/common';
import { IdentityInfraModule } from '../../infra/identity-infra.module';
import { CancelAdminAccessRequestController } from './cancel-admin-access-request.controller';
import { CancelAdminAccessRequestHandler } from './cancel-admin-access-request.handler';

@Module({
  imports: [IdentityInfraModule],
  controllers: [CancelAdminAccessRequestController],
  providers: [CancelAdminAccessRequestHandler],
})
export class CancelAdminAccessRequestModule {}
