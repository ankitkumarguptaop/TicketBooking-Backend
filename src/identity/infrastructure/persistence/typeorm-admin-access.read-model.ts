import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  AdminAccessReadModel,
  AdminAccessRequestFilter,
  AdminAccessRequestView,
  AdminView,
} from '../../application/ports/admin-access-read-model.port';
import { AdminAccessRequestStatus } from '../../domain/admin-access/admin-access-request-status.enum';
import { UserRole } from '../../domain/user-role.enum';

interface RequestRow {
  id: string;
  status: AdminAccessRequestStatus;
  reason: string;
  requested_at: Date;
  decided_at: Date | null;
  decision_note: string | null;
  requester_id: string;
  requester_email: string;
  requester_full_name: string;
  decider_id: string | null;
  decider_email: string | null;
  decider_full_name: string | null;
}

interface AdminRow {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: UserRole;
  admin_since: Date | null;
}

/** Joins stay inside the identity schema, so they are allowed. */
const REQUEST_SELECT = `
  SELECT r.id, r.status, r.reason, r.requested_at, r.decided_at, r.decision_note,
         u.id AS requester_id, u.email AS requester_email, u.full_name AS requester_full_name,
         d.id AS decider_id,   d.email AS decider_email,   d.full_name AS decider_full_name
    FROM identity.admin_access_requests r
    JOIN identity.users u      ON u.id = r.user_id
    LEFT JOIN identity.users d ON d.id = r.decided_by
`;

@Injectable()
export class TypeOrmAdminAccessReadModel implements AdminAccessReadModel {
  constructor(private readonly dataSource: DataSource) {}

  async findRequest(id: string): Promise<AdminAccessRequestView | null> {
    const rows: RequestRow[] = await this.dataSource.query(
      `${REQUEST_SELECT} WHERE r.id = $1`,
      [id],
    );
    return rows[0] ? toRequestView(rows[0]) : null;
  }

  async listRequests(
    filter: AdminAccessRequestFilter,
  ): Promise<AdminAccessRequestView[]> {
    const where: string[] = [];
    const params: unknown[] = [];
    if (filter.status) {
      params.push(filter.status);
      where.push(`r.status = $${params.length}`);
    }
    if (filter.userId) {
      params.push(filter.userId);
      where.push(`r.user_id = $${params.length}`);
    }
    // The pending list is a queue: oldest first. History: newest first.
    const order =
      filter.status === AdminAccessRequestStatus.PENDING ? 'ASC' : 'DESC';
    const rows: RequestRow[] = await this.dataSource.query(
      `${REQUEST_SELECT}
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY r.requested_at ${order}
       LIMIT 200`,
      params,
    );
    return rows.map(toRequestView);
  }

  async listAdmins(): Promise<AdminView[]> {
    const rows: AdminRow[] = await this.dataSource.query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.role,
              (SELECT max(r.decided_at)
                 FROM identity.admin_access_requests r
                WHERE r.user_id = u.id AND r.status = 'APPROVED') AS admin_since
         FROM identity.users u
        WHERE u.role IN ('ADMIN', 'SUPER_ADMIN')
        ORDER BY u.role DESC, u.full_name ASC`,
    );
    return rows.map((row) => ({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      phone: row.phone,
      role: row.role,
      adminSince: row.role === UserRole.SUPER_ADMIN ? null : row.admin_since,
    }));
  }
}

function toRequestView(row: RequestRow): AdminAccessRequestView {
  return {
    id: row.id,
    status: row.status,
    reason: row.reason,
    requestedAt: row.requested_at,
    decidedAt: row.decided_at,
    decisionNote: row.decision_note,
    requester: {
      id: row.requester_id,
      email: row.requester_email,
      fullName: row.requester_full_name,
    },
    decidedBy: row.decider_id
      ? {
          id: row.decider_id,
          email: row.decider_email!,
          fullName: row.decider_full_name!,
        }
      : null,
  };
}
