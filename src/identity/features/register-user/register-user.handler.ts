import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import { EmailAlreadyRegisteredError } from '../../domain/errors/identity.errors';
import { User } from '../../domain/user.aggregate';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../domain/ports/user.repository';
import { Email } from '../../domain/value-objects/email.vo';
import {
  PASSWORD_HASHER,
  PasswordHasher,
} from '../../domain/ports/password-hasher.port';
import { RegisterUserCommand } from './register-user.command';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler implements ICommandHandler<
  RegisterUserCommand,
  { userId: string }
> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(command: RegisterUserCommand): Promise<{ userId: string }> {
    const email = Email.create(command.email);

    if (await this.users.existsByEmail(email)) {
      throw new EmailAlreadyRegisteredError();
    }

    const user = User.register({
      id: randomUUID(),
      email,
      passwordHash: await this.hasher.hash(command.password),
      fullName: command.fullName,
      phone: command.phone,
      now: new Date(),
    });

    await this.users.save(user);

    return { userId: user.id };
  }
}
