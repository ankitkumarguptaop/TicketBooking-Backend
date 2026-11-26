import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Request, Response } from 'express';
import { AuthCookies } from '../../infra/http/auth-cookies';
import { LogoutCommand } from './logout.command';

@Controller('auth')
export class LogoutController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly cookies: AuthCookies,
  ) {}

  /** Logs out THIS device. Always succeeds and always clears cookies. */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    try {
      await this.commandBus.execute(
        new LogoutCommand(this.cookies.readRefreshToken(req)),
      );
    } finally {
      this.cookies.clear(res);
    }
  }
}
