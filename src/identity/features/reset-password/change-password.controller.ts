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
  AuthenticatedUser,
  CurrentUser,
} from '../../../shared/infra/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../shared/infra/auth/jwt-auth.guard';
import { ChangePasswordRequestDto } from './change-password.request.dto';
import { ResetPasswordCommand } from './reset-password.command';

/** "Change password", signed in. */
@UseGuards(JwtAuthGuard)
@Controller('users/me/password')
export class ChangePasswordController {
  constructor(private readonly commandBus: CommandBus) {}

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
