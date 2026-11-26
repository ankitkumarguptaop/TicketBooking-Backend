import { Module } from '@nestjs/common';
import { IdentityInfraModule } from '../../infra/identity-infra.module';
import { SendVerificationCodeController } from './send-verification-code.controller';
import { SendRegistrationVerificationCodeController } from './send-registration-verification-code.controller';
import { SendVerificationCodeHandler } from './send-verification-code.handler';

@Module({
  imports: [IdentityInfraModule],
  controllers: [
    SendVerificationCodeController,
    SendRegistrationVerificationCodeController,
  ],
  providers: [SendVerificationCodeHandler],
})
export class SendVerificationCodeModule {}
