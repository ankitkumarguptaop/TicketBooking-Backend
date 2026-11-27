import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MovieCertificate } from '../../domain/movie-certificate.enum';

export class ListMoviesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @Matches(/^[a-z]{2}$/, { message: 'language must be an ISO 639-1 code' })
  language?: string;

  @IsOptional()
  @IsString()
  @Length(1, 30)
  genre?: string;

  @IsOptional()
  @IsEnum(MovieCertificate)
  certificate?: MovieCertificate;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
