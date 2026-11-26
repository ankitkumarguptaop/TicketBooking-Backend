import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { PasswordResetRequestedResponseDto } from './password-reset-requested.response.dto';
import { RequestPasswordResetCommand } from './request-password-reset.command';
import { PasswordResetRequestedView } from './request-password-reset.handler';
import { RequestPasswordResetRequestDto } from './request-password-reset.request.dto';

/** "Forgot password", signed out. */
@Controller('auth/password-reset')
export class RequestPasswordResetController {
  constructor(private readonly commandBus: CommandBus) {}

  /** Always 200 with the same body, whether or not the email has an account. */
  @Post('request')
  @HttpCode(HttpStatus.OK)
  request(
    @Body() dto: RequestPasswordResetRequestDto,
  ): Promise<PasswordResetRequestedResponseDto> {
    return this.commandBus.execute<
      RequestPasswordResetCommand,
      PasswordResetRequestedView
    >(new RequestPasswordResetCommand(dto.email));
  }
}
