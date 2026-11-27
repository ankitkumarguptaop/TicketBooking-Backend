import { SeatCategory } from '../seat-category.enum';

export interface ScreenSummaryView {
  id: string;
  name: string;
  seatCount: number;
}

export interface TheatreView {
  id: string;
  name: string;
  city: string;
  address: string;
  screens: ScreenSummaryView[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SeatView {
  id: string;
  /** Row label printed on the chair, e.g. "G". */
  row: string;
  /** Seat number within the row, e.g. 12. */
  number: number;
  category: SeatCategory;
  /** Position on the drawn map (0-based); gaps between positions are aisles. */
  gridRow: number;
  gridCol: number;
}

export interface ScreenLayoutView {
  screenId: string;
  theatreId: string;
  name: string;
  seatCount: number;
  /** Ordered by gridRow, then gridCol. */
  seats: SeatView[];
}

export interface TheatreListFilter {
  /** Case-insensitive exact match. */
  city?: string;
  /** Case-insensitive substring of the name. */
  search?: string;
  page: number;
  limit: number;
}

export interface TheatrePage {
  items: TheatreView[];
  total: number;
  page: number;
  limit: number;
}

/** Queries read flat rows from the catalog schema directly (light CQRS). */
export interface TheatreReadModel {
  findTheatre(id: string): Promise<TheatreView | null>;
  listTheatres(filter: TheatreListFilter): Promise<TheatrePage>;
  findScreenLayout(screenId: string): Promise<ScreenLayoutView | null>;
}

export const THEATRE_READ_MODEL = Symbol('THEATRE_READ_MODEL');
