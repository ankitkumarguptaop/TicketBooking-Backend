import { SeatCategory } from '../../domain/seat-category.enum';

export interface PriceSpec {
  category: SeatCategory;
  /** Paise. */
  amountMinor: number;
}

/**
 * Manual scheduling (F5). The handler loads the Movie (runtime, ready?) and
 * the Screen (seat categories) from their repositories, then
 * Show.schedule(...) checks: movie ready, a price for every category on
 * the screen, no overlap incl. cleaning gap. Only the Show is saved.
 * Result: ShowView.
 */
export class ScheduleShowCommand {
  constructor(
    readonly movieId: string,
    readonly screenId: string,
    readonly startsAt: Date,
    readonly prices: PriceSpec[],
  ) {}
}
