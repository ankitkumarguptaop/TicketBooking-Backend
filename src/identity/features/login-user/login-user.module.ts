import { Module } from '@nestjs/common';
import { IdentityInfraModule } from '../../infra/identity-infra.module';
import { LoginUserController } from './login-user.controller';
import { LoginUserHandler } from './login-user.handler';

@Module({
  imports: [IdentityInfraModule],
  controllers: [LoginUserController],
  providers: [LoginUserHandler],
})
export class LoginUserModule {}
