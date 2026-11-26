import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
import { RevokeSessionCommand } from './revoke-session.command';

@Controller('auth')
export class RevokeSessionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly cookies: AuthCookies,
  ) {}

  /** Ends one specific session ("sign out my old laptop"). */
  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async revokeSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) sessionId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.commandBus.execute(
      new RevokeSessionCommand(user.sub, sessionId),
    );
    if (sessionId === user.sid) this.cookies.clear(res);
  }
}
