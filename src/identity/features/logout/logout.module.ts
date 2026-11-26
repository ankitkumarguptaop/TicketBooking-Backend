import { Module } from '@nestjs/common';
import { IdentityInfraModule } from '../../infra/identity-infra.module';
import { LogoutController } from './logout.controller';
import { LogoutHandler } from './logout.handler';

@Module({
  imports: [IdentityInfraModule],
  controllers: [LogoutController],
  providers: [LogoutHandler],
})
export class LogoutModule {}
