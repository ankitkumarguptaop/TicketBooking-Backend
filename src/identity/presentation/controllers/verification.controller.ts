import {
  Body,
  Controller,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ConfirmVerificationCodeCommand } from '../../application/commands/confirm-verification-code/confirm-verification-code.command';
import { SendVerificationCodeCommand } from '../../application/commands/send-verification-code/send-verification-code.command';
import { VerificationCodeSentView } from '../../application/commands/send-verification-code/send-verification-code.handler';
import { UserProfileView } from '../../application/queries/get-user-profile/user-profile.view';
import { ContactChannel } from '../../domain/verification/verification-channel.enum';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../decorators/current-user.decorator';
import { ConfirmVerificationCodeRequestDto } from '../dto/confirm-verification-code.request.dto';
import { UserProfileResponseDto } from '../dto/user-profile.response.dto';
import { VerificationCodeSentResponseDto } from '../dto/verification-code-sent.response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { parseChannel } from '../pipes/parse-channel.pipe';
@UseGuards(JwtAuthGuard)
@Controller('users/me/verification')
export class VerificationController {
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

  /** Checks the code; on success answers with the updated user. */
  @Post(':channel/confirm')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  confirm(
    @CurrentUser() user: AuthenticatedUser,
    @Param('channel', parseChannel) channel: ContactChannel,
    @Body() dto: ConfirmVerificationCodeRequestDto,
  ): Promise<UserProfileResponseDto> {
    return this.commandBus.execute<
      ConfirmVerificationCodeCommand,
      UserProfileView
    >(new ConfirmVerificationCodeCommand(user.sub, channel, dto.code));
  }
}
