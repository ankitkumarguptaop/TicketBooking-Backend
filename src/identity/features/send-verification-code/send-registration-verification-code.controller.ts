import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ContactChannel } from '../../domain/verification/verification-channel.enum';
import { parseChannel } from '../../infra/http/parse-channel.pipe';
import { VerificationTokenGuard } from '../../infra/http/verification-token.guard';
import { VerifyingUserId } from '../../infra/http/verifying-user-id.decorator';
import { SendVerificationCodeCommand } from './send-verification-code.command';
import { VerificationCodeSentView } from './send-verification-code.handler';
import { VerificationCodeSentResponseDto } from './verification-code-sent.response.dto';

/** During sign-up, before the first session (verification cookie only). */
@UseGuards(VerificationTokenGuard)
@Controller('auth/verification')
export class SendRegistrationVerificationCodeController {
  constructor(private readonly commandBus: CommandBus) {}

  /** Sends a new 6-digit code. 429 inside the 60 s resend cooldown. */
  @Post(':channel/send')
  @HttpCode(HttpStatus.OK)
  send(
    @VerifyingUserId() userId: string,
    @Param('channel', parseChannel) channel: ContactChannel,
  ): Promise<VerificationCodeSentResponseDto> {
    return this.commandBus.execute<
      SendVerificationCodeCommand,
      VerificationCodeSentView
    >(new SendVerificationCodeCommand(userId, channel));
  }
}
