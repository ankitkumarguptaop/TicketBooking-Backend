import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NoVerificationCodeError } from '../../domain/errors/identity.errors';
import {
  AUTH_SESSION_REPOSITORY,
  AuthSessionRepository,
} from '../../domain/ports/auth-session.repository';
import { SessionRevocationReason } from '../../domain/session/session-revocation-reason.enum';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../domain/ports/user.repository';
import { Email } from '../../domain/value-objects/email.vo';
import { VerificationChannel } from '../../domain/verification/verification-channel.enum';
import {
  VERIFICATION_CODE_REPOSITORY,
  VerificationCodeRepository,
} from '../../domain/ports/verification-code.repository';
import {
  OTP_CODEC,
  OtpCodec,
  otpScope,
} from '../../domain/ports/otp-codec.port';
import {
  PASSWORD_HASHER,
  PasswordHasher,
} from '../../domain/ports/password-hasher.port';
import { ResetPasswordCommand } from './reset-password.command';

const CHANNEL = VerificationChannel.PASSWORD_RESET;

/**
 * Code + new password -> password replaced, every session signed out
 * (except the caller's own, when changing it from the profile).
 * Signing out everywhere matters: if someone else knew the old password,
 * their sessions end now too.
 */
@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler implements ICommandHandler<
  ResetPasswordCommand,
  void
> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(VERIFICATION_CODE_REPOSITORY)
    private readonly codes: VerificationCodeRepository,
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly sessions: AuthSessionRepository,
    @Inject(OTP_CODEC) private readonly otp: OtpCodec,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(command: ResetPasswordCommand): Promise<void> {
    const user = await this.users.findByEmail(Email.create(command.email));
    // Unknown email and "never requested" get the same answer.
    const code = user ? await this.codes.findLatest(user.id, CHANNEL) : null;
    if (!user || !code) throw new NoVerificationCodeError();

    const now = new Date();
    try {
      code.verify(
        this.otp.hash(otpScope(user.id, CHANNEL), command.code),
        user.email.value,
        now,
      );
    } finally {
      // Save on success AND failure: a wrong guess must still count.
      await this.codes.save(code);
    }

    user.resetPassword(await this.hasher.hash(command.newPassword), now);
    await this.users.save(user);

    // Separate aggregates, saved one by one (as in "log out everywhere").
    for (const session of await this.sessions.findActiveByUserId(
      user.id,
      now,
    )) {
      if (session.id === command.keepSessionId) continue;
      session.revoke(SessionRevocationReason.PASSWORD_RESET, now);
      await this.sessions.save(session);
    }
  }
}
