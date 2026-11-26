export class RejectAdminAccessRequestCommand {
  constructor(
    readonly requestId: string,
    /** The SUPER_ADMIN deciding (the route only lets SUPER_ADMIN in). */
    readonly superAdminId: string,
    readonly note?: string,
  ) {}
}
