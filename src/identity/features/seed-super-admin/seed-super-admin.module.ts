import { Module } from '@nestjs/common';
import { IdentityInfraModule } from '../../infra/identity-infra.module';
import { SeedSuperAdminHandler } from './seed-super-admin.handler';

@Module({
  imports: [IdentityInfraModule],
  providers: [SeedSuperAdminHandler],
})
export class SeedSuperAdminModule {}
