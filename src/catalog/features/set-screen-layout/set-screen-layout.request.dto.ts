import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { SeatCategory } from '../../domain/seat-category.enum';

export class SeatSpecDto {
  /** Printed row label: 1-3 capital letters, e.g. "A", "AA". */
  @Matches(/^[A-Z]{1,3}$/, { message: 'row must be 1-3 capital letters' })
  row!: string;

  @IsInt()
  @Min(1)
  @Max(999)
  number!: number;

  @IsEnum(SeatCategory)
  category!: SeatCategory;

  @IsInt()
  @Min(0)
  @Max(199)
  gridRow!: number;

  @IsInt()
  @Min(0)
  @Max(199)
  gridCol!: number;
}

export class SetScreenLayoutRequestDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => SeatSpecDto)
  seats!: SeatSpecDto[];
}
