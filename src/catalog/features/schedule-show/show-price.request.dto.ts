import { IsEnum, IsInt, Max, Min } from 'class-validator';
import { SeatCategory } from '../../domain/seat-category.enum';

/** Price for one seat category, in paise (INR). */
export class ShowPriceRequestDto {
  @IsEnum(SeatCategory)
  category!: SeatCategory;

  @IsInt()
  @Min(0)
  @Max(10_000_000)
  amountMinor!: number;
}
