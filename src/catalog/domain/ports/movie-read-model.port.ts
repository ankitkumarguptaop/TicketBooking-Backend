import { MovieCertificate } from '../movie-certificate.enum';

/** Flat read model of one movie, returned by every movie endpoint. */
export interface MovieView {
  id: string;
  title: string;
  description: string | null;
  genres: string[];
  /** ISO 639-1 code, e.g. "hi", "en". Null until the admin sets it. */
  language: string | null;
  runtimeMinutes: number | null;
  certificate: MovieCertificate | null;
  /** "YYYY-MM-DD". */
  releaseDate: string | null;
  posterUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MovieListFilter {
  /** Case-insensitive substring of the title. Full-text search comes with F7. */
  search?: string;
  language?: string;
  genre?: string;
  certificate?: MovieCertificate;
  page: number;
  limit: number;
}

export interface MoviePage {
  items: MovieView[];
  total: number;
  page: number;
  limit: number;
}

/** Queries read flat rows from catalog.movies directly (light CQRS). */
export interface MovieReadModel {
  findById(id: string): Promise<MovieView | null>;
  /** Newest release first; movies without a release date last. */
  list(filter: MovieListFilter): Promise<MoviePage>;
}

export const MOVIE_READ_MODEL = Symbol('MOVIE_READ_MODEL');
