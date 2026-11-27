import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsISO8601,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ShowPriceRequestDto } from './show-price.request.dto';

export class ScheduleShowRequestDto {
  @IsUUID()
  movieId!: string;

  @IsUUID()
  screenId!: string;

  /** ISO 8601 with offset, e.g. "2026-12-01T18:30:00+05:30". */
  @IsISO8601({ strict: true })
  startsAt!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ShowPriceRequestDto)
  prices!: ShowPriceRequestDto[];
}
