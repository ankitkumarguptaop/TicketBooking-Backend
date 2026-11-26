import { Module } from '@nestjs/common';
import { IdentityInfraModule } from '../../infra/identity-infra.module';
import { GetVerificationStatusController } from './get-verification-status.controller';

@Module({
  imports: [IdentityInfraModule],
  controllers: [GetVerificationStatusController],
})
export class GetVerificationStatusModule {}
