/**
 * PENDING ──approve──▶ APPROVED
 *    │ └───reject───▶ REJECTED
 *    └─────cancel───▶ CANCELLED   (by the requester)
 * The last three are final.
 */
export enum AdminAccessRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}
