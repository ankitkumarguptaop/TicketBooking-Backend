import { SeatCategory } from '../../domain/seat-category.enum';

export interface SeatSpec {
  row: string;
  number: number;
  category: SeatCategory;
  gridRow: number;
  gridCol: number;
}

/**
 * Replaces the screen's whole seat layout. Screen decides the rules
 * (unique row+number, unique grid spot, not while future shows exist)
 * and raises ScreenLayoutChanged. Result: ScreenLayoutView.
 */
export class SetScreenLayoutCommand {
  constructor(
    readonly screenId: string,
    readonly seats: SeatSpec[],
  ) {}
}
