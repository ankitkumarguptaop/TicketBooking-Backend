import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MovieCertificate } from '../../domain/movie-certificate.enum';

/**
 * The optional movie fields, shared by add (POST) and update (PATCH).
 * Shape checks only; business rules live in the Movie aggregate.
 */
export class MovieFieldsDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ArrayUnique()
  @IsString({ each: true })
  @Length(1, 30, { each: true })
  genres?: string[];

  @IsOptional()
  @Matches(/^[a-z]{2}$/, { message: 'language must be an ISO 639-1 code' })
  language?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(600)
  runtimeMinutes?: number;

  @IsOptional()
  @IsEnum(MovieCertificate)
  certificate?: MovieCertificate;

  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'releaseDate must be YYYY-MM-DD' })
  releaseDate?: string;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  posterUrl?: string;
}

export class AddMovieRequestDto extends MovieFieldsDto {
  @IsString()
  @Length(1, 200)
  title!: string;
}
