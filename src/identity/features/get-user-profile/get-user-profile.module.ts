import { Module } from '@nestjs/common';
import { IdentityInfraModule } from '../../infra/identity-infra.module';
import { GetUserProfileController } from './get-user-profile.controller';
import { GetUserProfileHandler } from './get-user-profile.handler';

@Module({
  imports: [IdentityInfraModule],
  controllers: [GetUserProfileController],
  providers: [GetUserProfileHandler],
})
export class GetUserProfileModule {}
