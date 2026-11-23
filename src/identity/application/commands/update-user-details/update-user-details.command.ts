export class UpdateUserDetailsCommand {
  constructor(
    readonly userId: string,
    readonly fullName?: string,
    readonly phone?: string,
  ) {}
}
