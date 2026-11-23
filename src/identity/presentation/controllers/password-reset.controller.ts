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
import { ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { RequestPasswordResetCommand } from '../../application/commands/request-password-reset/request-password-reset.command';
import { PasswordResetRequestedView } from '../../application/commands/request-password-reset/request-password-reset.handler';
import { ResetPasswordCommand } from '../../application/commands/reset-password/reset-password.command';
import { AuthCookies } from '../cookies/auth-cookies';
import { PasswordResetRequestedResponseDto } from '../dto/password-reset-requested.response.dto';
import { RequestPasswordResetRequestDto } from '../dto/request-password-reset.request.dto';
import { ResetPasswordRequestDto } from '../dto/reset-password.request.dto';

/** "Forgot password": a 6-digit code by email, then a new password. No session needed. */
@ApiTags('auth')
@Controller('auth/password-reset')
export class PasswordResetController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly cookies: AuthCookies,
  ) {}

  /** Always 200 with the same body, whether or not the email has an account. */
  @Post('request')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: PasswordResetRequestedResponseDto })
  request(
    @Body() dto: RequestPasswordResetRequestDto,
  ): Promise<PasswordResetRequestedResponseDto> {
    return this.commandBus.execute<
      RequestPasswordResetCommand,
      PasswordResetRequestedView
    >(new RequestPasswordResetCommand(dto.email));
  }

  /** Checks the code, sets the new password and signs out every device. */
  @Post('confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Header('Cache-Control', 'no-store')
  @ApiNoContentResponse()
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
