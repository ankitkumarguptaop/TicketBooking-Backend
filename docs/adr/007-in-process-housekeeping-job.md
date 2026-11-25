# 007. In-process timer for deleting dead identity rows

- **Status:** Accepted
- **Date:** 2026-11-25
- **Context:** identity

## Context
Revoked/expired sessions, used verification codes and published outbox rows
are never needed again after a while, but nothing deleted them. RabbitMQ
(the planned home for delayed and scheduled jobs) arrives only in Phase 3.

## Options
1. **`@nestjs/schedule` cron.** A new dependency for one job.
2. **A database job (`pg_cron`).** Not available on every hosted Postgres.
3. **A `setInterval` service in the identity module**, guarded by a Postgres
   advisory lock so only one instance runs it.

## Decision
Option 3: `IdentityHousekeeping` runs a minute after boot and every
`HOUSEKEEPING_INTERVAL_MINUTES` (default 360). Retention: dead sessions 30 d,
codes 7 d after expiry, published outbox rows 7 d. Admin-access requests are
kept forever as the audit trail.

## Consequences
- Tables stay small without new infrastructure; runs are idempotent.
- **Cost:** a run happens only while an API instance is up; a long outage
  just postpones it.
- **Cost:** plain `DELETE`s; at large volumes they should delete in batches.
- Revisit in Phase 3: move the trigger to a RabbitMQ scheduled message; the SQL stays.
