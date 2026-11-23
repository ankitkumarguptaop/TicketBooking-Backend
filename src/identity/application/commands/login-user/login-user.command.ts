import { SessionDevice } from '../../../domain/session/auth-session.aggregate';

export class LoginUserCommand {
  constructor(
    readonly email: string,
    readonly password: string,
    readonly device: SessionDevice,
  ) {}
}
