import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RequestPasswordResetCommand } from '../../application/commands/request-password-reset/request-password-reset.command';
import { PasswordResetRequestedView } from '../../application/commands/request-password-reset/request-password-reset.handler';
import { ResetPasswordCommand } from '../../application/commands/reset-password/reset-password.command';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../decorators/current-user.decorator';
import { ChangePasswordRequestDto } from '../dto/change-password.request.dto';
import { PasswordResetRequestedResponseDto } from '../dto/password-reset-requested.response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

/**
 * Change password from the profile: a code to the account's own email,
 * then code + new password. Same use cases as "forgot password", but the
 * email comes from the session, and this session stays signed in.
 */
@ApiTags('users')
@ApiCookieAuth('access_token')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users/me/password')
export class ChangePasswordController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('code')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: PasswordResetRequestedResponseDto })
  sendCode(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PasswordResetRequestedResponseDto> {
    return this.commandBus.execute<
      RequestPasswordResetCommand,
      PasswordResetRequestedView
    >(new RequestPasswordResetCommand(user.email));
  }

  /** Sets the new password and signs out every OTHER device. */
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async change(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordRequestDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new ResetPasswordCommand(user.email, dto.code, dto.newPassword, user.sid),
    );
  }
}
