import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SeatCategory } from '../../domain/seat-category.enum';
import {
  ScreenLayoutView,
  ScreenSummaryView,
  TheatreListFilter,
  TheatrePage,
  TheatreView,
  TheatreReadModel,
} from '../../domain/ports/theatre-read-model.port';

interface TheatreRow {
  id: string;
  name: string;
  city: string;
  address: string;
  created_at: Date;
  updated_at: Date;
  /** json_agg output: already parsed by pg. */
  screens: ScreenSummaryView[];
  total?: string;
}

interface SeatRow {
  id: string;
  row_label: string;
  seat_number: number;
  category: SeatCategory;
  grid_row: number;
  grid_col: number;
}

/** Each theatre with its screens (name order) and their seat counts. */
const THEATRE_SELECT = `
  SELECT t.id, t.name, t.city, t.address, t.created_at, t.updated_at,
         COALESCE(s.screens, '[]'::json) AS screens
    FROM catalog.theatres t
    LEFT JOIN LATERAL (
      SELECT json_agg(
               json_build_object(
                 'id', sc.id,
                 'name', sc.name,
                 'seatCount', (SELECT count(*)::int FROM catalog.seats se WHERE se.screen_id = sc.id)
               ) ORDER BY sc.name
             ) AS screens
        FROM catalog.screens sc
       WHERE sc.theatre_id = t.id
    ) s ON true
`;

@Injectable()
export class TypeOrmTheatreReadModel implements TheatreReadModel {
  constructor(private readonly dataSource: DataSource) {}

  async findTheatre(id: string): Promise<TheatreView | null> {
    const rows: TheatreRow[] = await this.dataSource.query(
      `${THEATRE_SELECT} WHERE t.id = $1`,
      [id],
    );
    return rows[0] ? toTheatreView(rows[0]) : null;
  }

  async listTheatres(filter: TheatreListFilter): Promise<TheatrePage> {
    const where: string[] = [];
    const params: unknown[] = [];
    if (filter.city) {
      params.push(filter.city);
      where.push(`lower(t.city) = lower($${params.length})`);
    }
    if (filter.search) {
      params.push(`%${escapeLike(filter.search)}%`);
      where.push(`t.name ILIKE $${params.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [{ total }]: { total: string }[] = await this.dataSource.query(
      `SELECT count(*) AS total FROM catalog.theatres t ${whereSql}`,
      params,
    );
    const rows: TheatreRow[] = await this.dataSource.query(
      `${THEATRE_SELECT}
       ${whereSql}
       ORDER BY t.city ASC, t.name ASC, t.id ASC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, filter.limit, (filter.page - 1) * filter.limit],
    );
    return {
      items: rows.map(toTheatreView),
      total: Number(total),
      page: filter.page,
      limit: filter.limit,
    };
  }

  async findScreenLayout(screenId: string): Promise<ScreenLayoutView | null> {
    const screens: { id: string; theatre_id: string; name: string }[] =
      await this.dataSource.query(
        `SELECT id, theatre_id, name FROM catalog.screens WHERE id = $1`,
        [screenId],
      );
    if (!screens[0]) return null;

    const seats: SeatRow[] = await this.dataSource.query(
      `SELECT id, row_label, seat_number, category, grid_row, grid_col
         FROM catalog.seats
        WHERE screen_id = $1
        ORDER BY grid_row, grid_col`,
      [screenId],
    );
    return {
      screenId: screens[0].id,
      theatreId: screens[0].theatre_id,
      name: screens[0].name,
      seatCount: seats.length,
      seats: seats.map((s) => ({
        id: s.id,
        row: s.row_label,
        number: s.seat_number,
        category: s.category,
        gridRow: s.grid_row,
        gridCol: s.grid_col,
      })),
    };
  }
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

function toTheatreView(row: TheatreRow): TheatreView {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    address: row.address,
    screens: row.screens,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
