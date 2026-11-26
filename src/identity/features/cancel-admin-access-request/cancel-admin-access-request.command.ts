export class CancelAdminAccessRequestCommand {
  constructor(
    readonly requestId: string,
    readonly userId: string,
  ) {}
}
