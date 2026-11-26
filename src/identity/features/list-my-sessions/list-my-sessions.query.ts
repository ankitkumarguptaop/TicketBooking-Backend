export class ListMySessionsQuery {
  constructor(
    readonly userId: string,
    /** The `sid` of the caller's access token, to flag "this device". */
    readonly currentSessionId: string,
  ) {}
}
