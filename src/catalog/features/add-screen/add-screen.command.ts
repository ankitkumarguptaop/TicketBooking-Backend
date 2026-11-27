/**
 * Adds an empty screen to a theatre; seats come with set-screen-layout.
 * Result: ScreenLayoutView.
 */
export class AddScreenCommand {
  constructor(
    readonly theatreId: string,
    readonly name: string,
  ) {}
}
