import { Module } from '@nestjs/common';
import { ApproveAdminAccessRequestModule } from './features/approve-admin-access-request/approve-admin-access-request.module';
import { CancelAdminAccessRequestModule } from './features/cancel-admin-access-request/cancel-admin-access-request.module';
import { ConfirmVerificationCodeModule } from './features/confirm-verification-code/confirm-verification-code.module';
import { EndSessionsOnAdminRoleRevokedModule } from './features/end-sessions-on-admin-role-revoked/end-sessions-on-admin-role-revoked.module';
import { GetUserProfileModule } from './features/get-user-profile/get-user-profile.module';
import { GetVerificationStatusModule } from './features/get-verification-status/get-verification-status.module';
import { GrantAdminRoleOnApprovalModule } from './features/grant-admin-role-on-approval/grant-admin-role-on-approval.module';
import { ListAdminAccessRequestsModule } from './features/list-admin-access-requests/list-admin-access-requests.module';
import { ListAdminsModule } from './features/list-admins/list-admins.module';
import { ListMySessionsModule } from './features/list-my-sessions/list-my-sessions.module';
import { LoginUserModule } from './features/login-user/login-user.module';
import { LogoutAllSessionsModule } from './features/logout-all-sessions/logout-all-sessions.module';
import { LogoutModule } from './features/logout/logout.module';
import { RefreshSessionModule } from './features/refresh-session/refresh-session.module';
import { RegisterUserModule } from './features/register-user/register-user.module';
import { RejectAdminAccessRequestModule } from './features/reject-admin-access-request/reject-admin-access-request.module';
import { RequestPasswordResetModule } from './features/request-password-reset/request-password-reset.module';
import { ResetPasswordModule } from './features/reset-password/reset-password.module';
import { RevokeAdminRoleModule } from './features/revoke-admin-role/revoke-admin-role.module';
import { RevokeSessionModule } from './features/revoke-session/revoke-session.module';
import { SeedSuperAdminModule } from './features/seed-super-admin/seed-super-admin.module';
import { SendVerificationCodeModule } from './features/send-verification-code/send-verification-code.module';
import { SessionEventsModule } from './features/session-events/session-events.module';
import { SubmitAdminAccessRequestModule } from './features/submit-admin-access-request/submit-admin-access-request.module';
import { UpdateUserDetailsModule } from './features/update-user-details/update-user-details.module';
import { IdentityInfraModule } from './infra/identity-infra.module';

/** Identity service module: its infra plus one module per use case. */
@Module({
  imports: [
    IdentityInfraModule,
    // sign-up and sign-in
    RegisterUserModule,
    LoginUserModule,
    RefreshSessionModule,
    LogoutModule,
    LogoutAllSessionsModule,
    ListMySessionsModule,
    RevokeSessionModule,
    SessionEventsModule,
    // profile and contact verification
    GetUserProfileModule,
    UpdateUserDetailsModule,
    SendVerificationCodeModule,
    ConfirmVerificationCodeModule,
    GetVerificationStatusModule,
    // passwords
    RequestPasswordResetModule,
    ResetPasswordModule,
    // admin access
    SubmitAdminAccessRequestModule,
    ListAdminAccessRequestsModule,
    CancelAdminAccessRequestModule,
    ApproveAdminAccessRequestModule,
    RejectAdminAccessRequestModule,
    ListAdminsModule,
    RevokeAdminRoleModule,
    SeedSuperAdminModule,
    // reactions to identity's own events (delivered via the outbox)
    GrantAdminRoleOnApprovalModule,
    EndSessionsOnAdminRoleRevokedModule,
  ],
})
export class IdentityModule {}
