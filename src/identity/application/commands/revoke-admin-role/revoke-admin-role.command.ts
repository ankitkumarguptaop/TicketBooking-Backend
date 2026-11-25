export class RevokeAdminRoleCommand {
  constructor(
    readonly userId: string,
    /** The SUPER_ADMIN doing it. */
    readonly revokedBy: string,
  ) {}
}
