import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
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
@UseGuards(JwtAuthGuard)
@Controller('users/me/password')
export class ChangePasswordController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('code')
  @HttpCode(HttpStatus.OK)
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
  async change(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordRequestDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new ResetPasswordCommand(user.email, dto.code, dto.newPassword, user.sid),
    );
  }
}
