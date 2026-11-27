import { PriceSpec } from '../schedule-show/schedule-show.command';

/**
 * Automatic scheduling (F6). ShowScheduler (domain service) lays slots
 * from firstShowTime to lastShowTime each day using runtime + cleaning
 * gap, skipping or rejecting overlaps with existing shows.
 * Times are local to Asia/Kolkata. Result: ShowView[] of created shows.
 */
export class AutoScheduleShowsCommand {
  constructor(
    readonly movieId: string,
    readonly screenId: string,
    /** "YYYY-MM-DD", inclusive. */
    readonly fromDate: string,
    /** "YYYY-MM-DD", inclusive. */
    readonly toDate: string,
    /** "HH:mm": earliest start each day. */
    readonly firstShowTime: string,
    /** "HH:mm": latest start each day. */
    readonly lastShowTime: string,
    readonly prices: PriceSpec[],
  ) {}
}
