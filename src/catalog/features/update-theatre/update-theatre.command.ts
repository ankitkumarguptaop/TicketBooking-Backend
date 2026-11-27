/** Fields left undefined stay as they are. Result: TheatreView. */
export class UpdateTheatreCommand {
  constructor(
    readonly theatreId: string,
    readonly changes: { name?: string; city?: string; address?: string },
  ) {}
}
