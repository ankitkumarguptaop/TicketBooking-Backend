import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MovieCertificate } from '../../domain/movie-certificate.enum';
import {
  MovieListFilter,
  MoviePage,
  MovieReadModel,
  MovieView,
} from '../../domain/ports/movie-read-model.port';

interface MovieRow {
  id: string;
  title: string;
  description: string | null;
  genres: string[];
  language: string | null;
  runtime_minutes: number | null;
  certificate: MovieCertificate | null;
  release_date: string | null;
  poster_url: string | null;
  created_at: Date;
  updated_at: Date;
}

const MOVIE_COLUMNS = `
  m.id, m.title, m.description, m.genres, m.language, m.runtime_minutes,
  m.certificate, m.release_date, m.poster_url, m.created_at, m.updated_at
`;

@Injectable()
export class TypeOrmMovieReadModel implements MovieReadModel {
  constructor(private readonly dataSource: DataSource) {}

  async findById(id: string): Promise<MovieView | null> {
    const rows: MovieRow[] = await this.dataSource.query(
      `SELECT ${MOVIE_COLUMNS} FROM catalog.movies m WHERE m.id = $1`,
      [id],
    );
    return rows[0] ? toView(rows[0]) : null;
  }

  async list(filter: MovieListFilter): Promise<MoviePage> {
    const where: string[] = [];
    const params: unknown[] = [];
    if (filter.search) {
      params.push(`%${escapeLike(filter.search)}%`);
      where.push(`m.title ILIKE $${params.length}`);
    }
    if (filter.language) {
      params.push(filter.language);
      where.push(`m.language = $${params.length}`);
    }
    if (filter.genre) {
      params.push(filter.genre);
      where.push(`$${params.length} = ANY (m.genres)`);
    }
    if (filter.certificate) {
      params.push(filter.certificate);
      where.push(`m.certificate = $${params.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    params.push(filter.limit, (filter.page - 1) * filter.limit);
    // count(*) OVER () gives the total before LIMIT in the same round trip.
    const rows: (MovieRow & { total: string })[] = await this.dataSource.query(
      `SELECT ${MOVIE_COLUMNS}, count(*) OVER () AS total
         FROM catalog.movies m
         ${whereSql}
        ORDER BY m.release_date DESC NULLS LAST, m.title ASC, m.id ASC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    // A page past the end has no rows, so no total: count separately.
    const total = rows[0]
      ? Number(rows[0].total)
      : await this.count(whereSql, params.slice(0, -2));

    return {
      items: rows.map(toView),
      total,
      page: filter.page,
      limit: filter.limit,
    };
  }

  private async count(whereSql: string, params: unknown[]): Promise<number> {
    const [row]: { total: string }[] = await this.dataSource.query(
      `SELECT count(*) AS total FROM catalog.movies m ${whereSql}`,
      params,
    );
    return Number(row.total);
  }
}

/** So "50%" searches for a literal percent sign, not "50 then anything". */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

function toView(row: MovieRow): MovieView {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    genres: row.genres,
    language: row.language,
    runtimeMinutes: row.runtime_minutes,
    certificate: row.certificate,
    releaseDate: row.release_date,
    posterUrl: row.poster_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
