import { AggregateRoot } from '../../../shared/domain/aggregate-root';
import {
  AdminAccessRequestNotFoundError,
  AdminAccessRequestNotPendingError,
  InvalidAdminAccessReasonError,
  InvalidDecisionNoteError,
  NotEligibleForAdminAccessError,
} from '../errors/identity.errors';
import { AdminAccessApproved } from '../events/admin-access-approved.event';
import { AdminAccessRejected } from '../events/admin-access-rejected.event';
import { AdminAccessRequestCancelled } from '../events/admin-access-request-cancelled.event';
import { AdminAccessRequested } from '../events/admin-access-requested.event';
import { User } from '../user.aggregate';
import { UserRole } from '../../../shared/domain/user-role.enum';
import { VerificationChannel } from '../verification/verification-channel.enum';
import { AdminAccessRequestStatus } from './admin-access-request-status.enum';

/** Enough to tell the super admin why; short enough to read in a list. */
const REASON_MIN = 10;
const REASON_MAX = 500;
const NOTE_MAX = 500;

export interface AdminAccessRequestProps {
  id: string;
  /** The requester. Referenced by id only. */
  userId: string;
  reason: string;
  status: AdminAccessRequestStatus;
  requestedAt: Date;
  /** Set once the request leaves PENDING. */
  decidedAt: Date | null;
  /** The SUPER_ADMIN who approved/rejected; null when cancelled. */
  decidedBy: string | null;
  /** Optional message from the super admin (e.g. why it was rejected). */
  decisionNote: string | null;
  /** Optimistic-lock version as loaded from storage. 0 = never persisted. */
  version: number;
}

export interface SubmitAdminAccessRequestParams {
  id: string;
  requester: User;
  reason: string;
  now: Date;
}

/**
 * A user's request to become ADMIN (Identity context).
 *
 * Invariants:
 *  - only a USER with a verified email can submit one
 *  - reason is 10-500 characters after trimming
 *  - only PENDING requests can change, and every change is final
 *  - only the requester can cancel; only a super admin decides (checked by
 *    the route's role guard, because the domain has no notion of "caller")
 *  - at most one PENDING request per user (handler + unique index; it needs
 *    the repository, so it can't be checked in here)
 *
 * Approving does NOT change the user's role here: that is another
 * aggregate, changed by the AdminAccessApproved handler.
 */
export class AdminAccessRequest extends AggregateRoot {
  private constructor(private props: AdminAccessRequestProps) {
    super();
  }

  static submit(params: SubmitAdminAccessRequestParams): AdminAccessRequest {
    const { id, requester, now } = params;

    if (requester.role !== UserRole.USER) {
      throw new NotEligibleForAdminAccessError('ALREADY_ADMIN');
    }
    if (!requester.isVerified(VerificationChannel.EMAIL)) {
      throw new NotEligibleForAdminAccessError('EMAIL_NOT_VERIFIED');
    }

    const reason = (params.reason ?? '').trim();
    if (reason.length < REASON_MIN || reason.length > REASON_MAX) {
      throw new InvalidAdminAccessReasonError(REASON_MIN, REASON_MAX);
    }

    const request = new AdminAccessRequest({
      id,
      userId: requester.id,
      reason,
      status: AdminAccessRequestStatus.PENDING,
      requestedAt: now,
      decidedAt: null,
      decidedBy: null,
      decisionNote: null,
      version: 0,
    });
    request.raise(new AdminAccessRequested(id, requester.id, now));
    return request;
  }

  approve(superAdminId: string, note: string | undefined, now: Date): void {
    this.decide(AdminAccessRequestStatus.APPROVED, superAdminId, note, now);
    this.raise(
      new AdminAccessApproved(this.id, this.userId, superAdminId, now),
    );
  }

  reject(superAdminId: string, note: string | undefined, now: Date): void {
    this.decide(AdminAccessRequestStatus.REJECTED, superAdminId, note, now);
    this.raise(
      new AdminAccessRejected(this.id, this.userId, superAdminId, now),
    );
  }

  /** Someone else's request answers "not found", as for sessions (no IDOR hint). */
  cancel(byUserId: string, now: Date): void {
    if (byUserId !== this.props.userId) {
      throw new AdminAccessRequestNotFoundError(this.id);
    }
    this.assertPending();
    this.props.status = AdminAccessRequestStatus.CANCELLED;
    this.props.decidedAt = now;
    this.raise(new AdminAccessRequestCancelled(this.id, this.userId, now));
  }

  private decide(
    status: AdminAccessRequestStatus,
    superAdminId: string,
    rawNote: string | undefined,
    now: Date,
  ): void {
    this.assertPending();
    const note = rawNote?.trim() || null;
    if (note && note.length > NOTE_MAX) {
      throw new InvalidDecisionNoteError(NOTE_MAX);
    }
    this.props.status = status;
    this.props.decidedAt = now;
    this.props.decidedBy = superAdminId;
    this.props.decisionNote = note;
  }

  private assertPending(): void {
    if (this.props.status !== AdminAccessRequestStatus.PENDING) {
      throw new AdminAccessRequestNotPendingError(this.props.status);
    }
  }

  /** Rebuilds an existing request from storage. Raises no events. */
  static rehydrate(props: AdminAccessRequestProps): AdminAccessRequest {
    return new AdminAccessRequest({ ...props });
  }

  get id(): string {
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get reason(): string {
    return this.props.reason;
  }
  get status(): AdminAccessRequestStatus {
    return this.props.status;
  }
  get requestedAt(): Date {
    return this.props.requestedAt;
  }
  get decidedAt(): Date | null {
    return this.props.decidedAt;
  }
  get decidedBy(): string | null {
    return this.props.decidedBy;
  }
  get decisionNote(): string | null {
    return this.props.decisionNote;
  }
  get version(): number {
    return this.props.version;
  }
}
