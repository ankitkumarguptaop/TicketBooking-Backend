import { Module } from '@nestjs/common';
import { IdentityInfraModule } from '../../infra/identity-infra.module';
import { ListAdminsController } from './list-admins.controller';
import { ListAdminsHandler } from './list-admins.handler';

@Module({
  imports: [IdentityInfraModule],
  controllers: [ListAdminsController],
  providers: [ListAdminsHandler],
})
export class ListAdminsModule {}
