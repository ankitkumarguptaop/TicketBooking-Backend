import { Module } from '@nestjs/common';
import { IdentityInfraModule } from '../../infra/identity-infra.module';
import { RevokeSessionController } from './revoke-session.controller';
import { RevokeSessionHandler } from './revoke-session.handler';

@Module({
  imports: [IdentityInfraModule],
  controllers: [RevokeSessionController],
  providers: [RevokeSessionHandler],
})
export class RevokeSessionModule {}
