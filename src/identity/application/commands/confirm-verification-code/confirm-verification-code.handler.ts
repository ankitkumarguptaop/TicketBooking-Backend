import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import {
  NoVerificationCodeError,
  UserNotFoundError,
} from '../../../domain/errors/identity.errors';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../domain/user.repository';
import {
  VERIFICATION_CODE_REPOSITORY,
  VerificationCodeRepository,
} from '../../../domain/verification/verification-code.repository';
import { OTP_CODEC, OtpCodec, otpScope } from '../../ports/otp-codec.port';
import {
  toUserProfileView,
  UserProfileView,
} from '../../queries/get-user-profile/user-profile.view';
import { ConfirmVerificationCodeCommand } from './confirm-verification-code.command';

@CommandHandler(ConfirmVerificationCodeCommand)
export class ConfirmVerificationCodeHandler implements ICommandHandler<
  ConfirmVerificationCodeCommand,
  UserProfileView
> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(VERIFICATION_CODE_REPOSITORY)
    private readonly codes: VerificationCodeRepository,
    @Inject(OTP_CODEC) private readonly otp: OtpCodec,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: ConfirmVerificationCodeCommand,
  ): Promise<UserProfileView> {
    const { userId, channel } = command;
    const user = await this.users.findById(userId);
    if (!user) throw new UserNotFoundError(userId);

    // Idempotent: a double-submitted form gets the same answer, not an error.
    if (user.isVerified(channel)) return toUserProfileView(user);

    const code = await this.codes.findLatest(userId, channel);
    if (!code) throw new NoVerificationCodeError();

    const now = new Date();
    try {
      code.verify(
        this.otp.hash(otpScope(userId, channel), command.code),
        user.contactFor(channel),
        now,
      );
    } finally {
      // Save on success AND failure: a wrong guess must still count.
      await this.codes.save(code);
    }

    // Two aggregates, two saves, no shared transaction. If this second save
    // fails, the code is used up but the user isn't verified: they request
    // a new code. Rare, harmless, and simpler than a transaction or a saga.
    user.markVerified(channel, now);
    await this.users.save(user);
    this.eventBus.publishAll(user.pullDomainEvents());

    return toUserProfileView(user);
  }
}
