import { IsOptional, IsString, Length } from 'class-validator';
import { MovieFieldsDto } from '../add-movie/add-movie.request.dto';

/** PATCH: every field optional; only the ones sent change. */
export class UpdateMovieRequestDto extends MovieFieldsDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  title?: string;
}
