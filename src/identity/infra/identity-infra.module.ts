import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { jwtModuleOptions } from '../../shared/infra/auth/jwt-options';
import { ACCESS_TOKEN_ISSUER } from '../domain/ports/access-token-issuer.port';
import { ADMIN_ACCESS_READ_MODEL } from '../domain/ports/admin-access-read-model.port';
import { ADMIN_ACCESS_REQUEST_REPOSITORY } from '../domain/ports/admin-access-request.repository';
import { AUTH_SESSION_REPOSITORY } from '../domain/ports/auth-session.repository';
import { EMAIL_SENDER } from '../domain/ports/email-sender.port';
import { OTP_CODEC } from '../domain/ports/otp-codec.port';
import { PASSWORD_HASHER } from '../domain/ports/password-hasher.port';
import { REFRESH_TOKEN_CODEC } from '../domain/ports/refresh-token-codec.port';
import { SESSION_LIFETIME } from '../domain/ports/session-lifetime.token';
import { SMS_SENDER } from '../domain/ports/sms-sender.port';
import { USER_REPOSITORY } from '../domain/ports/user.repository';
import { VERIFICATION_CODE_REPOSITORY } from '../domain/ports/verification-code.repository';
import { VERIFICATION_TOKEN_SERVICE } from '../domain/ports/verification-token.port';
import { SessionLifetime } from '../domain/session/session-lifetime.vo';
import { IdentityHousekeeping } from './housekeeping/identity-housekeeping.service';
import { AuthCookies } from './http/auth-cookies';
import { VerificationTokenGuard } from './http/verification-token.guard';
import { LogSmsSender } from './messaging/log-sms-sender.adapter';
import { NodemailerEmailSender } from './messaging/nodemailer-email-sender.adapter';
import { OutboxRelay } from './messaging/outbox-relay.service';
import { TypeOrmAdminAccessReadModel } from './repository/typeorm-admin-access.read-model';
import { TypeOrmAdminAccessRequestRepository } from './repository/typeorm-admin-access-request.repository';
import { TypeOrmAuthSessionRepository } from './repository/typeorm-auth-session.repository';
import { TypeOrmUserRepository } from './repository/typeorm-user.repository';
import { TypeOrmVerificationCodeRepository } from './repository/typeorm-verification-code.repository';
import { Argon2PasswordHasher } from './security/argon2-password-hasher.adapter';
import { HmacOtpCodec } from './security/hmac-otp-codec.adapter';
import { HmacRefreshTokenCodec } from './security/hmac-refresh-token-codec.adapter';
import { JwtAccessTokenIssuer } from './security/jwt-access-token-issuer.adapter';
import { JwtVerificationTokenService } from './security/jwt-verification-token.adapter';
import { RepositoryActiveSessionChecker } from './security/repository-active-session-checker.adapter';

/** Port tokens the feature handlers inject. */
const PORTS = [
  USER_REPOSITORY,
  AUTH_SESSION_REPOSITORY,
  VERIFICATION_CODE_REPOSITORY,
  ADMIN_ACCESS_REQUEST_REPOSITORY,
  ADMIN_ACCESS_READ_MODEL,
  PASSWORD_HASHER,
  ACCESS_TOKEN_ISSUER,
  REFRESH_TOKEN_CODEC,
  OTP_CODEC,
  VERIFICATION_TOKEN_SERVICE,
  EMAIL_SENDER,
  SMS_SENDER,
  SESSION_LIFETIME,
];

/**
 * Binds identity's ports to adapters. Every identity feature module imports
 * this; Nest builds it once, so the outbox relay and housekeeping run once.
 */
@Module({
  imports: [
    // Signs access tokens with the same options AuthModule verifies them with.
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: jwtModuleOptions,
    }),
  ],
  providers: [
    // config
    {
      provide: SESSION_LIFETIME,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        SessionLifetime.of({
          idleTtlSeconds: Number(
            config.get('REFRESH_TOKEN_IDLE_TTL_SECONDS', 7 * 24 * 3600),
          ),
          absoluteTtlSeconds: Number(
            config.get('SESSION_ABSOLUTE_TTL_SECONDS', 30 * 24 * 3600),
          ),
        }),
    },
    // ports -> adapters
    { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },
    {
      provide: AUTH_SESSION_REPOSITORY,
      useClass: TypeOrmAuthSessionRepository,
    },
    {
      provide: VERIFICATION_CODE_REPOSITORY,
      useClass: TypeOrmVerificationCodeRepository,
    },
    {
      provide: ADMIN_ACCESS_REQUEST_REPOSITORY,
      useClass: TypeOrmAdminAccessRequestRepository,
    },
    { provide: ADMIN_ACCESS_READ_MODEL, useClass: TypeOrmAdminAccessReadModel },
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
    { provide: ACCESS_TOKEN_ISSUER, useClass: JwtAccessTokenIssuer },
    { provide: REFRESH_TOKEN_CODEC, useClass: HmacRefreshTokenCodec },
    { provide: OTP_CODEC, useClass: HmacOtpCodec },
    {
      provide: VERIFICATION_TOKEN_SERVICE,
      useClass: JwtVerificationTokenService,
    },
    { provide: EMAIL_SENDER, useClass: NodemailerEmailSender },
    // Dev only (refuses to start in production): swap for a real SMS provider.
    { provide: SMS_SENDER, useClass: LogSmsSender },
    // background work: outbox -> event bus, and deleting dead rows
    OutboxRelay,
    IdentityHousekeeping,
    // http helpers shared by identity's features
    AuthCookies,
    VerificationTokenGuard,
    // plugged into the shared AuthModule (JwtAuthGuard)
    RepositoryActiveSessionChecker,
  ],
  exports: [
    ...PORTS,
    AuthCookies,
    VerificationTokenGuard,
    RepositoryActiveSessionChecker,
  ],
})
export class IdentityInfraModule {}
