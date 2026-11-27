import { SeatCategory } from '../seat-category.enum';
import { ShowStatus } from '../show-status.enum';

export interface ShowPriceView {
  category: SeatCategory;
  /** Minor units (paise): 25000 = ₹250.00. */
  amountMinor: number;
  currency: string;
}

export interface ShowView {
  id: string;
  movieId: string;
  movieTitle: string;
  theatreId: string;
  theatreName: string;
  screenId: string;
  screenName: string;
  city: string;
  startsAt: Date;
  /** Movie ends (start + runtime). The cleaning gap after it isn't shown. */
  endsAt: Date;
  status: ShowStatus;
  prices: ShowPriceView[];
  createdAt: Date;
}

export interface ShowListFilter {
  /** Case-insensitive exact match. */
  city?: string;
  /** "YYYY-MM-DD", local date in Asia/Kolkata. */
  date?: string;
  movieId?: string;
  theatreId?: string;
  screenId?: string;
  page: number;
  limit: number;
}

export interface ShowPage {
  items: ShowView[];
  total: number;
  page: number;
  limit: number;
}

/** Queries read flat rows from the catalog schema directly (light CQRS). */
export interface ShowReadModel {
  findById(id: string): Promise<ShowView | null>;
  /** Upcoming SCHEDULED shows only, earliest first. */
  listUpcoming(filter: ShowListFilter, now: Date): Promise<ShowPage>;
}

export const SHOW_READ_MODEL = Symbol('SHOW_READ_MODEL');
