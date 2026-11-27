/** Result: TheatreView (re-read through THEATRE_READ_MODEL after save). */
export class AddTheatreCommand {
  constructor(
    readonly name: string,
    readonly city: string,
    readonly address: string,
  ) {}
}
