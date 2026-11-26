import { Module } from '@nestjs/common';
import { IdentityInfraModule } from '../../infra/identity-infra.module';
import { ResetPasswordController } from './reset-password.controller';
import { ChangePasswordController } from './change-password.controller';
import { ResetPasswordHandler } from './reset-password.handler';

@Module({
  imports: [IdentityInfraModule],
  controllers: [ResetPasswordController, ChangePasswordController],
  providers: [ResetPasswordHandler],
})
export class ResetPasswordModule {}
