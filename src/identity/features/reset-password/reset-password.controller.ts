import {
  Body,
  Controller,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Response } from 'express';
import { AuthCookies } from '../../infra/http/auth-cookies';
import { ResetPasswordCommand } from './reset-password.command';
import { ResetPasswordRequestDto } from './reset-password.request.dto';

/** "Forgot password", signed out. */
@Controller('auth/password-reset')
export class ResetPasswordController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly cookies: AuthCookies,
  ) {}

  /** Checks the code, sets the new password and signs out every device. */
  @Post('confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Header('Cache-Control', 'no-store')
  async confirm(
    @Body() dto: ResetPasswordRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.commandBus.execute(
      new ResetPasswordCommand(dto.email, dto.code, dto.newPassword),
    );
    // If this browser had a session, it was just revoked with all the others.
    this.cookies.clear(res);
  }
}
