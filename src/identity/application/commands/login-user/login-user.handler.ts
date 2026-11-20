import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InvalidCredentialsError } from '../../../domain/errors/identity.errors';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../domain/user.repository';
import { Email } from '../../../domain/value-objects/email.vo';
import {
  ACCESS_TOKEN_ISSUER,
  AccessTokenIssuer,
} from '../../ports/access-token-issuer.port';
import {
  PASSWORD_HASHER,
  PasswordHasher,
} from '../../ports/password-hasher.port';
import { LoginUserCommand } from './login-user.command';

export interface LoginResult {
  accessToken: string;
}

@CommandHandler(LoginUserCommand)
export class LoginUserHandler implements ICommandHandler<
  LoginUserCommand,
  LoginResult
> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(ACCESS_TOKEN_ISSUER) private readonly tokens: AccessTokenIssuer,
  ) {}

  async execute(command: LoginUserCommand): Promise<LoginResult> {
    const user = await this.users.findByEmail(Email.create(command.email));

    // Same error for unknown email and wrong password (no account enumeration).
    if (
      !user ||
      !(await this.hasher.verify(user.passwordHash, command.password))
    ) {
      throw new InvalidCredentialsError();
    }

    const accessToken = await this.tokens.issue({
      sub: user.id,
      email: user.email.value,
      role: user.role,
    });

    // TODO(phase 1): issue a rotating refresh token (httpOnly cookie).
    return { accessToken };
  }
}
