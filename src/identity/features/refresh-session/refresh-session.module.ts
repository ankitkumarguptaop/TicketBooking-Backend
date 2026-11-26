import { Module } from '@nestjs/common';
import { IdentityInfraModule } from '../../infra/identity-infra.module';
import { RefreshSessionController } from './refresh-session.controller';
import { RefreshSessionHandler } from './refresh-session.handler';

@Module({
  imports: [IdentityInfraModule],
  controllers: [RefreshSessionController],
  providers: [RefreshSessionHandler],
})
export class RefreshSessionModule {}
