export class SeedSuperAdminCommand {
  constructor(
    readonly email: string,
    readonly password: string,
    readonly fullName: string,
    readonly phone: string,
  ) {}
}
