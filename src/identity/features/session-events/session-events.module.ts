import { Module } from '@nestjs/common';
import { IdentityInfraModule } from '../../infra/identity-infra.module';
import { SessionEventsController } from './session-events.controller';

@Module({
  imports: [IdentityInfraModule],
  controllers: [SessionEventsController],
})
export class SessionEventsModule {}
