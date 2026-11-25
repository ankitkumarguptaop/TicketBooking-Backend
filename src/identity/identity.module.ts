import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApproveAdminAccessRequestHandler } from './application/commands/approve-admin-access-request/approve-admin-access-request.handler';
import { CancelAdminAccessRequestHandler } from './application/commands/cancel-admin-access-request/cancel-admin-access-request.handler';
import { RejectAdminAccessRequestHandler } from './application/commands/reject-admin-access-request/reject-admin-access-request.handler';
import { RevokeAdminRoleHandler } from './application/commands/revoke-admin-role/revoke-admin-role.handler';
import { SeedSuperAdminHandler } from './application/commands/seed-super-admin/seed-super-admin.handler';
import { SubmitAdminAccessRequestHandler } from './application/commands/submit-admin-access-request/submit-admin-access-request.handler';
import { EndSessionsOnAdminRoleRevokedHandler } from './application/event-handlers/end-sessions-on-admin-role-revoked.handler';
import { GrantAdminRoleOnApprovalHandler } from './application/event-handlers/grant-admin-role-on-approval.handler';
import { ADMIN_ACCESS_READ_MODEL } from './application/ports/admin-access-read-model.port';
import { ListAdminAccessRequestsHandler } from './application/queries/list-admin-access-requests/list-admin-access-requests.handler';
import { ListAdminsHandler } from './application/queries/list-admins/list-admins.handler';
import { ADMIN_ACCESS_REQUEST_REPOSITORY } from './domain/admin-access/admin-access-request.repository';
import { IdentityHousekeeping } from './infrastructure/housekeeping/identity-housekeeping.service';
import { OutboxRelay } from './infrastructure/outbox/outbox-relay.service';
import { AdminAccessRequestOrmEntity } from './infrastructure/persistence/admin-access-request.orm-entity';
import { OutboxMessageOrmEntity } from './infrastructure/persistence/outbox-message.orm-entity';
import { TypeOrmAdminAccessReadModel } from './infrastructure/persistence/typeorm-admin-access.read-model';
import { TypeOrmAdminAccessRequestRepository } from './infrastructure/persistence/typeorm-admin-access-request.repository';
import { AdminAccessController } from './presentation/controllers/admin-access.controller';
import { AdminsController } from './presentation/controllers/admins.controller';
import { ConfirmVerificationCodeHandler } from './application/commands/confirm-verification-code/confirm-verification-code.handler';
import { LoginUserHandler } from './application/commands/login-user/login-user.handler';
import { LogoutAllSessionsHandler } from './application/commands/logout-all-sessions/logout-all-sessions.handler';
import { LogoutHandler } from './application/commands/logout/logout.handler';
import { RefreshSessionHandler } from './application/commands/refresh-session/refresh-session.handler';
import { RegisterUserHandler } from './application/commands/register-user/register-user.handler';
import { RequestPasswordResetHandler } from './application/commands/request-password-reset/request-password-reset.handler';
import { ResetPasswordHandler } from './application/commands/reset-password/reset-password.handler';
import { RevokeSessionHandler } from './application/commands/revoke-session/revoke-session.handler';
import { SendVerificationCodeHandler } from './application/commands/send-verification-code/send-verification-code.handler';
import { UpdateUserDetailsHandler } from './application/commands/update-user-details/update-user-details.handler';
import { ACCESS_TOKEN_ISSUER } from './application/ports/access-token-issuer.port';
import { EMAIL_SENDER } from './application/ports/email-sender.port';
import { OTP_CODEC } from './application/ports/otp-codec.port';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { REFRESH_TOKEN_CODEC } from './application/ports/refresh-token-codec.port';
import { SMS_SENDER } from './application/ports/sms-sender.port';
import { VERIFICATION_TOKEN_SERVICE } from './application/ports/verification-token.port';
import { GetUserProfileHandler } from './application/queries/get-user-profile/get-user-profile.handler';
import { ListMySessionsHandler } from './application/queries/list-my-sessions/list-my-sessions.handler';
import { SESSION_LIFETIME } from './application/session-lifetime.provider';
import { AUTH_SESSION_REPOSITORY } from './domain/session/auth-session.repository';
import { SessionLifetime } from './domain/session/session-lifetime.vo';
import { USER_REPOSITORY } from './domain/user.repository';
import { VERIFICATION_CODE_REPOSITORY } from './domain/verification/verification-code.repository';
import { LogSmsSender } from './infrastructure/messaging/log-sms-sender.adapter';
import { NodemailerEmailSender } from './infrastructure/messaging/nodemailer-email-sender.adapter';
import { AuthSessionOrmEntity } from './infrastructure/persistence/auth-session.orm-entity';
import { TypeOrmAuthSessionRepository } from './infrastructure/persistence/typeorm-auth-session.repository';
import { TypeOrmUserRepository } from './infrastructure/persistence/typeorm-user.repository';
import { TypeOrmVerificationCodeRepository } from './infrastructure/persistence/typeorm-verification-code.repository';
import { UserOrmEntity } from './infrastructure/persistence/user.orm-entity';
import { VerificationCodeOrmEntity } from './infrastructure/persistence/verification-code.orm-entity';
import { Argon2PasswordHasher } from './infrastructure/security/argon2-password-hasher.adapter';
import { HmacOtpCodec } from './infrastructure/security/hmac-otp-codec.adapter';
import { HmacRefreshTokenCodec } from './infrastructure/security/hmac-refresh-token-codec.adapter';
import { JwtAccessTokenIssuer } from './infrastructure/security/jwt-access-token-issuer.adapter';
import { JwtVerificationTokenService } from './infrastructure/security/jwt-verification-token.adapter';
import { AuthController } from './presentation/controllers/auth.controller';
import { ChangePasswordController } from './presentation/controllers/change-password.controller';
import { PasswordResetController } from './presentation/controllers/password-reset.controller';
import { SessionEventsController } from './presentation/controllers/session-events.controller';
import { RegistrationVerificationController } from './presentation/controllers/registration-verification.controller';
import { UsersController } from './presentation/controllers/users.controller';
import { VerificationController } from './presentation/controllers/verification.controller';
import { AuthCookies } from './presentation/cookies/auth-cookies';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
import { RolesGuard } from './presentation/guards/roles.guard';
import { VerificationTokenGuard } from './presentation/guards/verification-token.guard';

const JWT_ALGORITHM = 'HS256';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([
      UserOrmEntity,
      AuthSessionOrmEntity,
      VerificationCodeOrmEntity,
      AdminAccessRequestOrmEntity,
      OutboxMessageOrmEntity,
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.getOrThrow<string>('JWT_ACCESS_SECRET');
        if (secret.length < 32) {
          throw new Error('JWT_ACCESS_SECRET must be at least 32 characters');
        }
        const issuer = config.get<string>('JWT_ISSUER', 'ticket-booking-api');
        const audience = config.get<string>('JWT_AUDIENCE', 'ticket-booking');
        return {
          secret,
          signOptions: {
            algorithm: JWT_ALGORITHM,
            // Env values are strings; a bare string like "900" would be read
            // as 900 MILLISECONDS by jsonwebtoken, so convert explicitly.
            expiresIn: Number(config.get('JWT_ACCESS_TTL_SECONDS', 900)),
            issuer,
            audience,
          },
          verifyOptions: {
            algorithms: [JWT_ALGORITHM], // never trust the token's own "alg"
            issuer,
            audience,
          },
        };
      },
    }),
  ],
  controllers: [
    AuthController,
    SessionEventsController,
    UsersController,
    VerificationController,
    RegistrationVerificationController,
    PasswordResetController,
    ChangePasswordController,
    AdminAccessController,
    AdminsController,
  ],
  providers: [
    // use cases
    RegisterUserHandler,
    LoginUserHandler,
    RefreshSessionHandler,
    LogoutHandler,
    LogoutAllSessionsHandler,
    RevokeSessionHandler,
    UpdateUserDetailsHandler,
    SendVerificationCodeHandler,
    ConfirmVerificationCodeHandler,
    RequestPasswordResetHandler,
    ResetPasswordHandler,
    GetUserProfileHandler,
    ListMySessionsHandler,
    SubmitAdminAccessRequestHandler,
    ApproveAdminAccessRequestHandler,
    RejectAdminAccessRequestHandler,
    CancelAdminAccessRequestHandler,
    RevokeAdminRoleHandler,
    SeedSuperAdminHandler,
    ListAdminAccessRequestsHandler,
    ListAdminsHandler,
    // reactions to identity's own events (delivered via the outbox)
    GrantAdminRoleOnApprovalHandler,
    EndSessionsOnAdminRoleRevokedHandler,
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
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
    { provide: ACCESS_TOKEN_ISSUER, useClass: JwtAccessTokenIssuer },
    { provide: REFRESH_TOKEN_CODEC, useClass: HmacRefreshTokenCodec },
    {
      provide: VERIFICATION_CODE_REPOSITORY,
      useClass: TypeOrmVerificationCodeRepository,
    },
    { provide: OTP_CODEC, useClass: HmacOtpCodec },
    {
      provide: VERIFICATION_TOKEN_SERVICE,
      useClass: JwtVerificationTokenService,
    },
    {
      provide: ADMIN_ACCESS_REQUEST_REPOSITORY,
      useClass: TypeOrmAdminAccessRequestRepository,
    },
    { provide: ADMIN_ACCESS_READ_MODEL, useClass: TypeOrmAdminAccessReadModel },
    { provide: EMAIL_SENDER, useClass: NodemailerEmailSender },
    // Dev only (refuses to start in production): swap for a real SMS provider.
    { provide: SMS_SENDER, useClass: LogSmsSender },
    // background work: outbox -> event bus, and deleting dead rows
    OutboxRelay,
    IdentityHousekeeping,
    // presentation helpers
    AuthCookies,
    // guards, reused by other contexts for protected / admin routes
    JwtAuthGuard,
    RolesGuard,
    VerificationTokenGuard,
  ],
  // The repository is exported because JwtAuthGuard needs it wherever
  // another module uses @UseGuards(JwtAuthGuard).
  exports: [JwtModule, JwtAuthGuard, RolesGuard, AUTH_SESSION_REPOSITORY],
})
export class IdentityModule {}
