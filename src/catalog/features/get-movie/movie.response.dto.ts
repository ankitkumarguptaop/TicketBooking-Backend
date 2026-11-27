import { MovieCertificate } from '../../domain/movie-certificate.enum';

export class MovieResponseDto {
  id!: string;
  title!: string;
  description!: string | null;
  genres!: string[];
  language!: string | null;
  runtimeMinutes!: number | null;
  certificate!: MovieCertificate | null;
  releaseDate!: string | null;
  posterUrl!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
