export class LogoutCommand {
  /** Raw refresh cookie value; may be missing or garbage. */
  constructor(readonly refreshToken: unknown) {}
}
