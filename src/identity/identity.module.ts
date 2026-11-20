import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ACCESS_TOKEN_ISSUER } from './application/ports/access-token-issuer.port';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { LoginUserHandler } from './application/commands/login-user/login-user.handler';
import { RegisterUserHandler } from './application/commands/register-user/register-user.handler';
import { GetUserProfileHandler } from './application/queries/get-user-profile/get-user-profile.handler';
import { USER_REPOSITORY } from './domain/user.repository';
import { TypeOrmUserRepository } from './infrastructure/persistence/typeorm-user.repository';
import { UserOrmEntity } from './infrastructure/persistence/user.orm-entity';
import { Argon2PasswordHasher } from './infrastructure/security/argon2-password-hasher.adapter';
import { JwtAccessTokenIssuer } from './infrastructure/security/jwt-access-token-issuer.adapter';
import { AuthController } from './presentation/controllers/auth.controller';
import { UsersController } from './presentation/controllers/users.controller';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
import { RolesGuard } from './presentation/guards/roles.guard';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([UserOrmEntity]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: config.get<number>('JWT_ACCESS_TTL_SECONDS', 900),
        },
      }),
    }),
  ],
  controllers: [AuthController, UsersController],
  providers: [
    // use cases
    RegisterUserHandler,
    LoginUserHandler,
    GetUserProfileHandler,
    // ports -> adapters
    { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
    { provide: ACCESS_TOKEN_ISSUER, useClass: JwtAccessTokenIssuer },
    // guards, reused by other contexts for protected / admin routes
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [JwtModule, JwtAuthGuard, RolesGuard],
})
export class IdentityModule {}
