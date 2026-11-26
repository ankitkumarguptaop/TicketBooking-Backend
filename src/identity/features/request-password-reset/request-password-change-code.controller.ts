import {
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
import { PasswordResetRequestedResponseDto } from './password-reset-requested.response.dto';
import { RequestPasswordResetCommand } from './request-password-reset.command';
import { PasswordResetRequestedView } from './request-password-reset.handler';

/** "Change password", signed in: the code goes to the account's own email. */
@UseGuards(JwtAuthGuard)
@Controller('users/me/password')
export class RequestPasswordChangeCodeController {
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
}
