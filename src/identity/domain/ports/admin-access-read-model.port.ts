import { AdminAccessRequestStatus } from '../admin-access/admin-access-request-status.enum';
import { UserRole } from '../../../shared/domain/user-role.enum';

export interface PersonRef {
  id: string;
  email: string;
  fullName: string;
}

/** Flat read model for one admin-access request, with who asked and who decided. */
export interface AdminAccessRequestView {
  id: string;
  status: AdminAccessRequestStatus;
  reason: string;
  requestedAt: Date;
  decidedAt: Date | null;
  decisionNote: string | null;
  requester: PersonRef;
  decidedBy: PersonRef | null;
}

export interface AdminView {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  /** When their admin request was approved; null for the seeded super admin. */
  adminSince: Date | null;
}

export interface AdminAccessRequestFilter {
  status?: AdminAccessRequestStatus;
  userId?: string;
}

/**
 * Port for the admin screens' reads. Queries read flat rows directly
 * (light CQRS), joining tables inside the identity schema only.
 */
export interface AdminAccessReadModel {
  findRequest(id: string): Promise<AdminAccessRequestView | null>;
  /** Oldest first for PENDING (a queue), newest first otherwise. */
  listRequests(
    filter: AdminAccessRequestFilter,
  ): Promise<AdminAccessRequestView[]>;
  /** ADMINs and the SUPER_ADMIN. */
  listAdmins(): Promise<AdminView[]>;
}

export const ADMIN_ACCESS_READ_MODEL = Symbol('ADMIN_ACCESS_READ_MODEL');
