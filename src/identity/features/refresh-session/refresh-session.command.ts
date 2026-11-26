export class RefreshSessionCommand {
  /** Raw cookie value; may be missing or garbage. */
  constructor(readonly refreshToken: unknown) {}
}
