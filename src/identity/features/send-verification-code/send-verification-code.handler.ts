import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import {
  AlreadyVerifiedError,
  UserNotFoundError,
} from '../../domain/errors/identity.errors';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../domain/ports/user.repository';
import {
  ContactChannel,
  VerificationChannel,
} from '../../domain/verification/verification-channel.enum';
import {
  VERIFICATION_CODE_POLICY,
  VerificationCode,
} from '../../domain/verification/verification-code.aggregate';
import {
  VERIFICATION_CODE_REPOSITORY,
  VerificationCodeRepository,
} from '../../domain/ports/verification-code.repository';
import {
  EMAIL_SENDER,
  EmailSender,
} from '../../domain/ports/email-sender.port';
import {
  OTP_CODEC,
  OtpCodec,
  otpScope,
} from '../../domain/ports/otp-codec.port';
import { SMS_SENDER, SmsSender } from '../../domain/ports/sms-sender.port';
import { maskContact } from './mask-contact';
import { SendVerificationCodeCommand } from './send-verification-code.command';
import {
  verificationEmail,
  verificationSms,
} from '../../infra/messaging/verification-messages';

export interface VerificationCodeSentView {
  channel: VerificationChannel;
  /** Masked, e.g. "an***@example.com". */
  sentTo: string;
  expiresAt: Date;
  resendAvailableAt: Date;
}

const TTL_MINUTES = VERIFICATION_CODE_POLICY.ttlMs / 60_000;

@CommandHandler(SendVerificationCodeCommand)
export class SendVerificationCodeHandler implements ICommandHandler<
  SendVerificationCodeCommand,
  VerificationCodeSentView
> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(VERIFICATION_CODE_REPOSITORY)
    private readonly codes: VerificationCodeRepository,
    @Inject(OTP_CODEC) private readonly otp: OtpCodec,
    @Inject(EMAIL_SENDER) private readonly email: EmailSender,
    @Inject(SMS_SENDER) private readonly sms: SmsSender,
  ) {}

  async execute(
    command: SendVerificationCodeCommand,
  ): Promise<VerificationCodeSentView> {
    const { userId, channel } = command;
    const user = await this.users.findById(userId);
    if (!user) throw new UserNotFoundError(userId);
    if (user.isVerified(channel)) throw new AlreadyVerifiedError(channel);

    const destination = user.contactFor(channel);
    const previous = await this.codes.findLatest(userId, channel);
    const otp = this.otp.generate(otpScope(userId, channel));

    // Throws VerificationResendTooSoonError inside the cooldown.
    const code = VerificationCode.issue(
      {
        id: randomUUID(),
        userId,
        channel,
        destination,
        codeHash: otp.hash,
        now: new Date(),
      },
      previous,
    );

    // Deliver first, save second. If delivery fails, nothing is saved, so the
    // 60 s cooldown doesn't block a retry for a code that never arrived.
    // (If the save fails, the delivered code just won't work; resend fixes it.)
    await this.deliver(channel, destination, otp.code);
    await this.codes.save(code);

    return {
      channel,
      sentTo: maskContact(channel, destination),
      expiresAt: code.expiresAt,
      resendAvailableAt: code.resendAvailableAt,
    };
  }

  private deliver(
    channel: ContactChannel,
    destination: string,
    code: string,
  ): Promise<void> {
    return channel === VerificationChannel.EMAIL
      ? this.email.send(verificationEmail(destination, code, TTL_MINUTES))
      : this.sms.send(verificationSms(destination, code, TTL_MINUTES));
  }
}
