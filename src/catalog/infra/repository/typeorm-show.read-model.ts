import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  ShowListFilter,
  ShowPage,
  ShowPriceView,
  ShowReadModel,
  ShowView,
} from '../../domain/ports/show-read-model.port';
import { ShowStatus } from '../../domain/show-status.enum';

interface ShowRow {
  id: string;
  movie_id: string;
  movie_title: string;
  theatre_id: string;
  theatre_name: string;
  screen_id: string;
  screen_name: string;
  city: string;
  starts_at: Date;
  ends_at: Date;
  status: ShowStatus;
  created_at: Date;
  /** json_agg output: already parsed by pg. */
  prices: ShowPriceView[];
}

/** Every show is listed in Indian local time (single-country app for now). */
const LOCAL_TZ = 'Asia/Kolkata';

const SHOW_SELECT = `
  SELECT s.id, s.movie_id, m.title AS movie_title,
         t.id AS theatre_id, t.name AS theatre_name,
         s.screen_id, sc.name AS screen_name, t.city,
         s.starts_at, s.ends_at, s.status, s.created_at,
         COALESCE(p.prices, '[]'::json) AS prices
    FROM catalog.shows s
    JOIN catalog.movies m    ON m.id = s.movie_id
    JOIN catalog.screens sc  ON sc.id = s.screen_id
    JOIN catalog.theatres t  ON t.id = sc.theatre_id
    LEFT JOIN LATERAL (
      SELECT json_agg(
               json_build_object(
                 'category', sp.seat_category,
                 'amountMinor', sp.amount_minor,
                 'currency', sp.currency
               ) ORDER BY sp.amount_minor
             ) AS prices
        FROM catalog.show_prices sp
       WHERE sp.show_id = s.id
    ) p ON true
`;

@Injectable()
export class TypeOrmShowReadModel implements ShowReadModel {
  constructor(private readonly dataSource: DataSource) {}

  async findById(id: string): Promise<ShowView | null> {
    const rows: ShowRow[] = await this.dataSource.query(
      `${SHOW_SELECT} WHERE s.id = $1`,
      [id],
    );
    return rows[0] ? toView(rows[0]) : null;
  }

  async listUpcoming(filter: ShowListFilter, now: Date): Promise<ShowPage> {
    const params: unknown[] = [now];
    const where = [`s.status = 'SCHEDULED'`, `s.starts_at > $1`];
    if (filter.city) {
      params.push(filter.city);
      where.push(`lower(t.city) = lower($${params.length})`);
    }
    if (filter.date) {
      params.push(filter.date);
      where.push(
        `(s.starts_at AT TIME ZONE '${LOCAL_TZ}')::date = $${params.length}::date`,
      );
    }
    for (const [column, value] of [
      ['s.movie_id', filter.movieId],
      ['sc.theatre_id', filter.theatreId],
      ['s.screen_id', filter.screenId],
    ] as const) {
      if (value) {
        params.push(value);
        where.push(`${column} = $${params.length}`);
      }
    }
    const whereSql = `WHERE ${where.join(' AND ')}`;

    const [{ total }]: { total: string }[] = await this.dataSource.query(
      `SELECT count(*) AS total
         FROM catalog.shows s
         JOIN catalog.screens sc  ON sc.id = s.screen_id
         JOIN catalog.theatres t  ON t.id = sc.theatre_id
         ${whereSql}`,
      params,
    );
    const rows: ShowRow[] = await this.dataSource.query(
      `${SHOW_SELECT}
       ${whereSql}
       ORDER BY s.starts_at ASC, s.id ASC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, filter.limit, (filter.page - 1) * filter.limit],
    );
    return {
      items: rows.map(toView),
      total: Number(total),
      page: filter.page,
      limit: filter.limit,
    };
  }
}

function toView(row: ShowRow): ShowView {
  return {
    id: row.id,
    movieId: row.movie_id,
    movieTitle: row.movie_title,
    theatreId: row.theatre_id,
    theatreName: row.theatre_name,
    screenId: row.screen_id,
    screenName: row.screen_name,
    city: row.city,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    prices: row.prices,
    createdAt: row.created_at,
  };
}
