import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../../shared/infra/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../shared/infra/auth/jwt-auth.guard';
import { ContactChannel } from '../../domain/verification/verification-channel.enum';
import { parseChannel } from '../../infra/http/parse-channel.pipe';
import { SendVerificationCodeCommand } from './send-verification-code.command';
import { VerificationCodeSentView } from './send-verification-code.handler';
import { VerificationCodeSentResponseDto } from './verification-code-sent.response.dto';

/** For a signed-in user verifying a contact they added or changed. */
@UseGuards(JwtAuthGuard)
@Controller('users/me/verification')
export class SendVerificationCodeController {
  constructor(private readonly commandBus: CommandBus) {}

  /** Sends a new 6-digit code. 429 inside the 60 s resend cooldown. */
  @Post(':channel/send')
  @HttpCode(HttpStatus.OK)
  send(
    @CurrentUser() user: AuthenticatedUser,
    @Param('channel', parseChannel) channel: ContactChannel,
  ): Promise<VerificationCodeSentResponseDto> {
    return this.commandBus.execute<
      SendVerificationCodeCommand,
      VerificationCodeSentView
    >(new SendVerificationCodeCommand(user.sub, channel));
  }
}
