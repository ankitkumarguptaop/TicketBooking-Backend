import { Body, Controller, Inject, Post, Res } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Response } from 'express';
import {
  VERIFICATION_TOKEN_SERVICE,
  VerificationTokenService,
} from '../../domain/ports/verification-token.port';
import { AuthCookies } from '../../infra/http/auth-cookies';
import { RegisterUserCommand } from './register-user.command';
import { RegisterUserRequestDto } from './register-user.request.dto';
import { RegisterUserResponseDto } from './register-user.response.dto';

@Controller('auth')
export class RegisterUserController {
  constructor(
    private readonly commandBus: CommandBus,
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
}
