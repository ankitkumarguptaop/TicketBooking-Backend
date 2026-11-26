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
import { ContactChannel } from '../../domain/verification/verification-channel.enum';
import { parseChannel } from '../../infra/http/parse-channel.pipe';
import { VerificationTokenGuard } from '../../infra/http/verification-token.guard';
import { VerifyingUserId } from '../../infra/http/verifying-user-id.decorator';
import { UserProfileView } from '../get-user-profile/user-profile.view';
import {
  toVerificationStatus,
  VerificationStatusResponseDto,
} from '../get-verification-status/verification-status.response.dto';
import { ConfirmVerificationCodeCommand } from './confirm-verification-code.command';
import { ConfirmVerificationCodeRequestDto } from './confirm-verification-code.request.dto';

/** During sign-up, before the first session (verification cookie only). */
@UseGuards(VerificationTokenGuard)
@Controller('auth/verification')
export class ConfirmRegistrationVerificationCodeController {
  constructor(private readonly commandBus: CommandBus) {}

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
    return toVerificationStatus(user);
  }
}
