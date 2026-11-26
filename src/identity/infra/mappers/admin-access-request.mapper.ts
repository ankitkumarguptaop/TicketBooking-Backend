import { AdminAccessRequest } from '../../domain/admin-access/admin-access-request.aggregate';
import { AdminAccessRequestOrmEntity } from './admin-access-request.orm-entity';

export class AdminAccessRequestMapper {
  static toDomain(row: AdminAccessRequestOrmEntity): AdminAccessRequest {
    return AdminAccessRequest.rehydrate({
      id: row.id,
      userId: row.userId,
      reason: row.reason,
      status: row.status,
      requestedAt: row.requestedAt,
      decidedAt: row.decidedAt,
      decidedBy: row.decidedBy,
      decisionNote: row.decisionNote,
      version: row.version,
    });
  }

  /** Columns that can change after creation. */
  static toChangedColumns(
    request: AdminAccessRequest,
  ): Pick<
    AdminAccessRequestOrmEntity,
    'status' | 'decidedAt' | 'decidedBy' | 'decisionNote'
  > {
    return {
      status: request.status,
      decidedAt: request.decidedAt,
      decidedBy: request.decidedBy,
      decisionNote: request.decisionNote,
    };
  }
}
