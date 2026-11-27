import { SeatCategory } from '../../domain/seat-category.enum';

export class SeatResponseDto {
  id!: string;
  row!: string;
  number!: number;
  category!: SeatCategory;
  gridRow!: number;
  gridCol!: number;
}

export class ScreenLayoutResponseDto {
  screenId!: string;
  theatreId!: string;
  name!: string;
  seatCount!: number;
  seats!: SeatResponseDto[];
}
