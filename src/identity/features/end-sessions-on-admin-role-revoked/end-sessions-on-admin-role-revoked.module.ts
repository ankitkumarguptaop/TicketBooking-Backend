import { Module } from '@nestjs/common';
import { IdentityInfraModule } from '../../infra/identity-infra.module';
import { EndSessionsOnAdminRoleRevokedHandler } from './end-sessions-on-admin-role-revoked.handler';

@Module({
  imports: [IdentityInfraModule],
  providers: [EndSessionsOnAdminRoleRevokedHandler],
})
export class EndSessionsOnAdminRoleRevokedModule {}
