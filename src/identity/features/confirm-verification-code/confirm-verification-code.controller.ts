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
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../../shared/infra/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../shared/infra/auth/jwt-auth.guard';
import { ContactChannel } from '../../domain/verification/verification-channel.enum';
import { parseChannel } from '../../infra/http/parse-channel.pipe';
import { UserProfileResponseDto } from '../get-user-profile/user-profile.response.dto';
import { UserProfileView } from '../get-user-profile/user-profile.view';
import { ConfirmVerificationCodeCommand } from './confirm-verification-code.command';
import { ConfirmVerificationCodeRequestDto } from './confirm-verification-code.request.dto';

/** For a signed-in user verifying a contact they added or changed. */
@UseGuards(JwtAuthGuard)
@Controller('users/me/verification')
export class ConfirmVerificationCodeController {
  constructor(private readonly commandBus: CommandBus) {}

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
