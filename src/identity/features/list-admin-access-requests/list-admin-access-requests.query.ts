import { AdminAccessRequestStatus } from '../../domain/admin-access/admin-access-request-status.enum';

/** Without userId: every user's requests (super admin). With it: one user's own. */
export class ListAdminAccessRequestsQuery {
  constructor(
    readonly status?: AdminAccessRequestStatus,
    readonly userId?: string,
  ) {}
}
