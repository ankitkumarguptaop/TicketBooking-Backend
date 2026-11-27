import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsUUID,
  Matches,
  ValidateNested,
} from 'class-validator';
import { ShowPriceRequestDto } from '../schedule-show/show-price.request.dto';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Shape only; "from <= to", range length, first <= last are domain rules. */
export class AutoScheduleShowsRequestDto {
  @IsUUID()
  movieId!: string;

  @IsUUID()
  screenId!: string;

  @Matches(DATE, { message: 'fromDate must be YYYY-MM-DD' })
  fromDate!: string;

  @Matches(DATE, { message: 'toDate must be YYYY-MM-DD' })
  toDate!: string;

  @Matches(TIME, { message: 'firstShowTime must be HH:mm' })
  firstShowTime!: string;

  @Matches(TIME, { message: 'lastShowTime must be HH:mm' })
  lastShowTime!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ShowPriceRequestDto)
  prices!: ShowPriceRequestDto[];
}
