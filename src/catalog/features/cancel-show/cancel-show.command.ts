/**
 * SCHEDULED -> CANCELLED; raises ShowCancelled (booking refunds holders,
 * listing cache is invalidated). Result: ShowView.
 */
export class CancelShowCommand {
  constructor(
    readonly showId: string,
    readonly reason?: string,
  ) {}
}
