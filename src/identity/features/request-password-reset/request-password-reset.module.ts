import { Module } from '@nestjs/common';
import { IdentityInfraModule } from '../../infra/identity-infra.module';
import { RequestPasswordResetController } from './request-password-reset.controller';
import { RequestPasswordChangeCodeController } from './request-password-change-code.controller';
import { RequestPasswordResetHandler } from './request-password-reset.handler';

@Module({
  imports: [IdentityInfraModule],
  controllers: [
    RequestPasswordResetController,
    RequestPasswordChangeCodeController,
  ],
  providers: [RequestPasswordResetHandler],
})
export class RequestPasswordResetModule {}
