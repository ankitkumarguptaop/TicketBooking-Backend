import { SeatCategory } from '../../domain/seat-category.enum';
import { ShowStatus } from '../../domain/show-status.enum';

export class ShowPriceResponseDto {
  category!: SeatCategory;
  amountMinor!: number;
  currency!: string;
}

export class ShowResponseDto {
  id!: string;
  movieId!: string;
  movieTitle!: string;
  theatreId!: string;
  theatreName!: string;
  screenId!: string;
  screenName!: string;
  city!: string;
  startsAt!: Date;
  endsAt!: Date;
  status!: ShowStatus;
  prices!: ShowPriceResponseDto[];
  createdAt!: Date;
}
