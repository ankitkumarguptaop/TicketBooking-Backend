import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { LoginUserCommand } from '../../application/commands/login-user/login-user.command';
import { LoginResult } from '../../application/commands/login-user/login-user.handler';
import { RegisterUserCommand } from '../../application/commands/register-user/register-user.command';
import { AccessTokenResponseDto } from '../dto/access-token.response.dto';
import { LoginUserRequestDto } from '../dto/login-user.request.dto';
import { RegisterUserRequestDto } from '../dto/register-user.request.dto';
import { RegisterUserResponseDto } from '../dto/register-user.response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('register')
  register(
    @Body() dto: RegisterUserRequestDto,
  ): Promise<RegisterUserResponseDto> {
    return this.commandBus.execute(
      new RegisterUserCommand(dto.email, dto.password, dto.fullName),
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginUserRequestDto): Promise<AccessTokenResponseDto> {
    return this.commandBus.execute<LoginUserCommand, LoginResult>(
      new LoginUserCommand(dto.email, dto.password),
    );
  }
}
