import {
  Controller,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Request, Response } from 'express';
import { AuthTokens } from '../../domain/ports/auth-tokens';
import { AuthCookies } from '../../infra/http/auth-cookies';
import { RefreshSessionCommand } from './refresh-session.command';
import { RefreshResponseDto } from './refresh.response.dto';

@Controller('auth')
export class RefreshSessionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly cookies: AuthCookies,
  ) {}

  /**
   * Rotates the refresh token of this device's session. Needs no access
   * token (it's usually expired by now). Any failure ends the session on
   * the client: cookies are cleared and the app must sign in again.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshResponseDto> {
    try {
      const tokens = await this.commandBus.execute<
        RefreshSessionCommand,
        AuthTokens
      >(new RefreshSessionCommand(this.cookies.readRefreshToken(req)));
      this.cookies.set(res, tokens);
      return { accessTokenExpiresAt: tokens.accessTokenExpiresAt };
    } catch (err) {
      this.cookies.clear(res);
      throw err;
    }
  }
}
