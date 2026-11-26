import { ContactChannel } from '../../domain/verification/verification-channel.enum';

export class ConfirmVerificationCodeCommand {
  constructor(
    readonly userId: string,
    readonly channel: ContactChannel,
    readonly code: string,
  ) {}
}
