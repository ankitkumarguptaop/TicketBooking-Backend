import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Inject,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Request, Response } from 'express';
import { AuthTokens } from '../../application/commands/auth-tokens';
import { LoginUserCommand } from '../../application/commands/login-user/login-user.command';
import { LoginResult } from '../../application/commands/login-user/login-user.handler';
import { LogoutAllSessionsCommand } from '../../application/commands/logout-all-sessions/logout-all-sessions.command';
import { LogoutCommand } from '../../application/commands/logout/logout.command';
import { RefreshSessionCommand } from '../../application/commands/refresh-session/refresh-session.command';
import { RegisterUserCommand } from '../../application/commands/register-user/register-user.command';
import { RevokeSessionCommand } from '../../application/commands/revoke-session/revoke-session.command';
import { ListMySessionsQuery } from '../../application/queries/list-my-sessions/list-my-sessions.query';
import { SessionView } from '../../application/queries/list-my-sessions/session.view';
import {
  VERIFICATION_TOKEN_SERVICE,
  VerificationTokenService,
} from '../../application/ports/verification-token.port';
import { EmailNotVerifiedError } from '../../domain/errors/identity.errors';
import { SessionDevice } from '../../domain/session/auth-session.aggregate';
import { AuthCookies } from '../cookies/auth-cookies';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../decorators/current-user.decorator';
import { LoginUserRequestDto } from '../dto/login-user.request.dto';
import { LoginResponseDto } from '../dto/login.response.dto';
import { LogoutAllResponseDto } from '../dto/logout-all.response.dto';
import { RefreshResponseDto } from '../dto/refresh.response.dto';
import { RegisterUserRequestDto } from '../dto/register-user.request.dto';
import { RegisterUserResponseDto } from '../dto/register-user.response.dto';
import { SessionResponseDto } from '../dto/session.response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly cookies: AuthCookies,
    @Inject(VERIFICATION_TOKEN_SERVICE)
    private readonly verificationTokens: VerificationTokenService,
  ) {}

  /**
   * Creates the account. No session: instead a short-lived verification
   * cookie lets this browser verify the email (and optionally the phone)
   * at /auth/verification/*, before the first sign-in.
   */
  @Post('register')
  async register(
    @Body() dto: RegisterUserRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RegisterUserResponseDto> {
    const result = await this.commandBus.execute<
      RegisterUserCommand,
      RegisterUserResponseDto
    >(
      new RegisterUserCommand(dto.email, dto.password, dto.fullName, dto.phone),
    );
    this.cookies.setVerification(
      res,
      await this.verificationTokens.issue(result.userId),
    );
    return result;
  }

  /** Starts a new session for this device and sets both auth cookies. */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async login(
    @Body() dto: LoginUserRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    let result: LoginResult;
    try {
      result = await this.commandBus.execute<LoginUserCommand, LoginResult>(
        new LoginUserCommand(
          dto.email,
          dto.password,
          this.deviceOf(req, dto.deviceName),
        ),
      );
    } catch (err) {
      // Right password, unverified email: no session, but a fresh
      // verification cookie so the app can send them to finish sign-up.
      if (err instanceof EmailNotVerifiedError) {
        this.cookies.setVerification(
          res,
          await this.verificationTokens.issue(err.userId),
        );
      }
      throw err;
    }
    const { user, tokens } = result;
    this.cookies.set(res, tokens);
    this.cookies.clearVerification(res);
    return { user, accessTokenExpiresAt: tokens.accessTokenExpiresAt };
  }

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

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  listSessions(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SessionResponseDto[]> {
    return this.queryBus.execute<ListMySessionsQuery, SessionView[]>(
      new ListMySessionsQuery(user.sub, user.sid),
    );
  }

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

  private deviceOf(req: Request, deviceName?: string): SessionDevice {
    const userAgent = req.get('user-agent');
    return {
      deviceName: deviceName?.trim() || null,
      userAgent: userAgent ? userAgent.slice(0, 512) : null,
      ipAddress: req.ip ? req.ip.slice(0, 45) : null,
    };
  }
}
