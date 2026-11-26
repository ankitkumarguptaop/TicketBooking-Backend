import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ConfirmVerificationCodeCommand } from '../../application/commands/confirm-verification-code/confirm-verification-code.command';
import { SendVerificationCodeCommand } from '../../application/commands/send-verification-code/send-verification-code.command';
import { VerificationCodeSentView } from '../../application/commands/send-verification-code/send-verification-code.handler';
import { GetUserProfileQuery } from '../../application/queries/get-user-profile/get-user-profile.query';
import { UserProfileView } from '../../application/queries/get-user-profile/user-profile.view';
import { ContactChannel } from '../../domain/verification/verification-channel.enum';
import { VerifyingUserId } from '../decorators/verifying-user-id.decorator';
import { ConfirmVerificationCodeRequestDto } from '../dto/confirm-verification-code.request.dto';
import { VerificationCodeSentResponseDto } from '../dto/verification-code-sent.response.dto';
import { VerificationStatusResponseDto } from '../dto/verification-status.response.dto';
import { VerificationTokenGuard } from '../guards/verification-token.guard';
import { parseChannel } from '../pipes/parse-channel.pipe';

function toStatus(user: UserProfileView): VerificationStatusResponseDto {
  return {
    email: user.email,
    phone: user.phone,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
  };
}
@UseGuards(VerificationTokenGuard)
@Controller('auth/verification')
export class RegistrationVerificationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('status')
  @Header('Cache-Control', 'no-store')
  async status(
    @VerifyingUserId() userId: string,
  ): Promise<VerificationStatusResponseDto> {
    const user = await this.queryBus.execute<
      GetUserProfileQuery,
      UserProfileView
    >(new GetUserProfileQuery(userId));
    return toStatus(user);
  }

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

  /** Checks the code; on success answers with the new status. */
  @Post(':channel/confirm')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async confirm(
    @VerifyingUserId() userId: string,
    @Param('channel', parseChannel) channel: ContactChannel,
    @Body() dto: ConfirmVerificationCodeRequestDto,
  ): Promise<VerificationStatusResponseDto> {
    const user = await this.commandBus.execute<
      ConfirmVerificationCodeCommand,
      UserProfileView
    >(new ConfirmVerificationCodeCommand(userId, channel, dto.code));
    return toStatus(user);
  }
}
