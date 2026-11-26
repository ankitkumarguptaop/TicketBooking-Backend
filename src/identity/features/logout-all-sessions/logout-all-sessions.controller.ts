import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Response } from 'express';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../../shared/infra/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../shared/infra/auth/jwt-auth.guard';
import { AuthCookies } from '../../infra/http/auth-cookies';
import { LogoutAllResponseDto } from './logout-all.response.dto';
import { LogoutAllSessionsCommand } from './logout-all-sessions.command';

@Controller('auth')
export class LogoutAllSessionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly cookies: AuthCookies,
  ) {}

  /** Logs out EVERY device of the current user, including this one. */
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logoutAll(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutAllResponseDto> {
    const result = await this.commandBus.execute<
      LogoutAllSessionsCommand,
      { revoked: number }
    >(new LogoutAllSessionsCommand(user.sub));
    this.cookies.clear(res);
    return result;
  }
}
