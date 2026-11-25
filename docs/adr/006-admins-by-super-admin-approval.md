# 006. Three roles; admins only by super-admin approval

- **Status:** Accepted
- **Date:** 2026-11-25
- **Context:** identity

## Context
Admins manage catalog, venues and shows. Nobody may become an admin by
signing up or by editing a request body, and there must be a clear record of
who granted admin rights to whom.

## Options
1. **Admins created by SQL by hand.** No audit trail, no UI, easy to get wrong.
2. **Any admin can promote others.** One compromised admin creates more.
3. **A single seeded SUPER_ADMIN approves admin-access requests.**

## Decision
Option 3:
- Roles `USER < ADMIN < SUPER_ADMIN`, ranked in `RolesGuard`.
- `SUPER_ADMIN` comes only from `npm run seed:super-admin` (idempotent,
  never promotes an existing account); at most one, by a partial unique index;
  its role can't be changed through the domain.
- A verified `USER` submits an `AdminAccessRequest` with a reason
  (PENDING → APPROVED | REJECTED | CANCELLED; one pending per user).
- Approval changes the request; the user becomes ADMIN in a handler of
  `AdminAccessApproved` (one aggregate per transaction, via the outbox, ADR 005).
- Demotion revokes all of the user's sessions so the old ADMIN token dies at
  once (relies on ADR 003).

## Consequences
- Every admin has a request row: who asked, why, who approved, when.
- **Cost:** the super admin is a single point of control; its password
  must be strong, and losing it needs a database fix or the reset flow.
- **Cost:** a promotion shows up at the user's next token refresh (≤ 15 min),
  not instantly.
- **Cost:** no emails about decisions until the Notification context exists.
