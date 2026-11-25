import { AdminAccessRequest } from './admin-access-request.aggregate';

/** Port. Implemented in infrastructure/persistence. */
export interface AdminAccessRequestRepository {
  findById(id: string): Promise<AdminAccessRequest | null>;
  /** The user's open request, if any (at most one, enforced by a unique index). */
  findPendingByUserId(userId: string): Promise<AdminAccessRequest | null>;
  /**
   * Inserts or updates (optimistic lock on `version`) and writes the pulled
   * domain events to the outbox in the same transaction.
   * Throws AdminAccessRequestAlreadyPendingError if a second pending request
   * for the same user races in, ConcurrentAdminAccessUpdateError if the
   * request was saved by someone else after it was loaded.
   */
  save(request: AdminAccessRequest): Promise<void>;
}

export const ADMIN_ACCESS_REQUEST_REPOSITORY = Symbol(
  'ADMIN_ACCESS_REQUEST_REPOSITORY',
);
