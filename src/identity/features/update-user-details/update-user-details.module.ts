import { Module } from '@nestjs/common';
import { IdentityInfraModule } from '../../infra/identity-infra.module';
import { UpdateUserDetailsController } from './update-user-details.controller';
import { UpdateUserDetailsHandler } from './update-user-details.handler';

@Module({
  imports: [IdentityInfraModule],
  controllers: [UpdateUserDetailsController],
  providers: [UpdateUserDetailsHandler],
})
export class UpdateUserDetailsModule {}
