import {
  Body,
  Controller,
  Header,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Request, Response } from 'express';
import { EmailNotVerifiedError } from '../../domain/errors/identity.errors';
import {
  VERIFICATION_TOKEN_SERVICE,
  VerificationTokenService,
} from '../../domain/ports/verification-token.port';
import { SessionDevice } from '../../domain/session/auth-session.aggregate';
import { AuthCookies } from '../../infra/http/auth-cookies';
import { LoginUserCommand } from './login-user.command';
import { LoginResult } from './login-user.handler';
import { LoginUserRequestDto } from './login-user.request.dto';
import { LoginResponseDto } from './login.response.dto';

@Controller('auth')
export class LoginUserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly cookies: AuthCookies,
    @Inject(VERIFICATION_TOKEN_SERVICE)
    private readonly verificationTokens: VerificationTokenService,
  ) {}

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

  private deviceOf(req: Request, deviceName?: string): SessionDevice {
    const userAgent = req.get('user-agent');
    return {
      deviceName: deviceName?.trim() || null,
      userAgent: userAgent ? userAgent.slice(0, 512) : null,
      ipAddress: req.ip ? req.ip.slice(0, 45) : null,
    };
  }
}
