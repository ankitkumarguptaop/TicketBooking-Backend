export class ResetPasswordCommand {
  constructor(
    readonly email: string,
    readonly code: string,
    readonly newPassword: string,
    /** Signed-in change: this session stays; every other one ends. */
    readonly keepSessionId?: string,
  ) {}
}
