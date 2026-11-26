import { Module } from '@nestjs/common';
import { IdentityInfraModule } from '../../infra/identity-infra.module';
import { RevokeAdminRoleController } from './revoke-admin-role.controller';
import { RevokeAdminRoleHandler } from './revoke-admin-role.handler';

@Module({
  imports: [IdentityInfraModule],
  controllers: [RevokeAdminRoleController],
  providers: [RevokeAdminRoleHandler],
})
export class RevokeAdminRoleModule {}
