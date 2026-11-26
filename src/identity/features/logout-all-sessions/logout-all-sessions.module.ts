import { Module } from '@nestjs/common';
import { IdentityInfraModule } from '../../infra/identity-infra.module';
import { LogoutAllSessionsController } from './logout-all-sessions.controller';
import { LogoutAllSessionsHandler } from './logout-all-sessions.handler';

@Module({
  imports: [IdentityInfraModule],
  controllers: [LogoutAllSessionsController],
  providers: [LogoutAllSessionsHandler],
})
export class LogoutAllSessionsModule {}
