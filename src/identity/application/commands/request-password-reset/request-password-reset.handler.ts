import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import { VerificationResendTooSoonError } from '../../../domain/errors/identity.errors';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../domain/user.repository';
import { Email } from '../../../domain/value-objects/email.vo';
import { VerificationChannel } from '../../../domain/verification/verification-channel.enum';
import {
  VERIFICATION_CODE_POLICY,
  VerificationCode,
} from '../../../domain/verification/verification-code.aggregate';
import {
  VERIFICATION_CODE_REPOSITORY,
  VerificationCodeRepository,
} from '../../../domain/verification/verification-code.repository';
import { EMAIL_SENDER, EmailSender } from '../../ports/email-sender.port';
import { OTP_CODEC, OtpCodec, otpScope } from '../../ports/otp-codec.port';
import { passwordResetEmail } from '../send-verification-code/verification-messages';
import { RequestPasswordResetCommand } from './request-password-reset.command';

export interface PasswordResetRequestedView {
  /** When the form may offer "Resend". Same answer whether or not the email exists. */
  resendAvailableAt: Date;
}

const TTL_MINUTES = VERIFICATION_CODE_POLICY.ttlMs / 60_000;
const CHANNEL = VerificationChannel.PASSWORD_RESET;

/**
 * Emails a reset code if the account exists. The answer is the SAME for
 * unknown emails and inside the resend cooldown, so this endpoint can't be
 * used to find out who has an account.
 */
@CommandHandler(RequestPasswordResetCommand)
export class RequestPasswordResetHandler implements ICommandHandler<
  RequestPasswordResetCommand,
  PasswordResetRequestedView
> {
  private readonly logger = new Logger(RequestPasswordResetHandler.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(VERIFICATION_CODE_REPOSITORY)
    private readonly codes: VerificationCodeRepository,
    @Inject(OTP_CODEC) private readonly otp: OtpCodec,
    @Inject(EMAIL_SENDER) private readonly email: EmailSender,
  ) {}

  async execute(
    command: RequestPasswordResetCommand,
  ): Promise<PasswordResetRequestedView> {
    const now = new Date();
    const answer = {
      resendAvailableAt: new Date(
        now.getTime() + VERIFICATION_CODE_POLICY.resendCooldownMs,
      ),
    };

    const user = await this.users.findByEmail(Email.create(command.email));
    if (!user) return answer;

    const destination = user.email.value;
    const previous = await this.codes.findLatest(user.id, CHANNEL);
    const otp = this.otp.generate(otpScope(user.id, CHANNEL));

    let code: VerificationCode;
    try {
      code = VerificationCode.issue(
        {
          id: randomUUID(),
          userId: user.id,
          channel: CHANNEL,
          destination,
          codeHash: otp.hash,
          now,
        },
        previous,
      );
    } catch (err) {
      // A 429 here would tell a stranger "this email has an account".
      // The earlier code is still valid, so silently doing nothing is fine.
      if (err instanceof VerificationResendTooSoonError) return answer;
      throw err;
    }

    // Deliver first, save second (same reasoning as verification codes).
    try {
      await this.email.send(
        passwordResetEmail(destination, otp.code, TTL_MINUTES),
      );
    } catch (err) {
      // Also no error to the client: a failure only for real accounts would
      // reveal them too. The user just asks again; we see it in the logs.
      this.logger.error(`Password reset email failed for user ${user.id}`, err);
      return answer;
    }
    await this.codes.save(code);
    return answer;
  }
}
