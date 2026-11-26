import { Module } from '@nestjs/common';
import { IdentityInfraModule } from '../../infra/identity-infra.module';
import { RegisterUserController } from './register-user.controller';
import { RegisterUserHandler } from './register-user.handler';

@Module({
  imports: [IdentityInfraModule],
  controllers: [RegisterUserController],
  providers: [RegisterUserHandler],
})
export class RegisterUserModule {}
