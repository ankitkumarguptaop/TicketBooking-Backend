import { MovieResponseDto } from '../get-movie/movie.response.dto';

export class MoviePageResponseDto {
  items!: MovieResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
}
