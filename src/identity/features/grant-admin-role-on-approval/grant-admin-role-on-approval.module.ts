import { Module } from '@nestjs/common';
import { IdentityInfraModule } from '../../infra/identity-infra.module';
import { GrantAdminRoleOnApprovalHandler } from './grant-admin-role-on-approval.handler';

@Module({
  imports: [IdentityInfraModule],
  providers: [GrantAdminRoleOnApprovalHandler],
})
export class GrantAdminRoleOnApprovalModule {}
