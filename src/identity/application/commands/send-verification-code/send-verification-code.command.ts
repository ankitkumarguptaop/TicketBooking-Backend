import { ContactChannel } from '../../../domain/verification/verification-channel.enum';

export class SendVerificationCodeCommand {
  constructor(
    readonly userId: string,
    readonly channel: ContactChannel,
  ) {}
}
