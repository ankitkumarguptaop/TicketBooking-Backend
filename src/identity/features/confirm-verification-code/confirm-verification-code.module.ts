import { Module } from '@nestjs/common';
import { IdentityInfraModule } from '../../infra/identity-infra.module';
import { ConfirmVerificationCodeController } from './confirm-verification-code.controller';
import { ConfirmRegistrationVerificationCodeController } from './confirm-registration-verification-code.controller';
import { ConfirmVerificationCodeHandler } from './confirm-verification-code.handler';

@Module({
  imports: [IdentityInfraModule],
  controllers: [
    ConfirmVerificationCodeController,
    ConfirmRegistrationVerificationCodeController,
  ],
  providers: [ConfirmVerificationCodeHandler],
})
export class ConfirmVerificationCodeModule {}
