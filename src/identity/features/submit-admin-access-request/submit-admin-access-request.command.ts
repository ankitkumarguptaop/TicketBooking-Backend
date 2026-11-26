export class SubmitAdminAccessRequestCommand {
  constructor(
    readonly userId: string,
    readonly reason: string,
  ) {}
}
