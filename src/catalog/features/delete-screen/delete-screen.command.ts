/**
 * Removes a screen and its layout. Must be refused while the screen has
 * shows: fk_shows_screen (RESTRICT) guarantees it at the database, but the
 * handler should check first and throw a clear domain error.
 */
export class DeleteScreenCommand {
  constructor(readonly screenId: string) {}
}
