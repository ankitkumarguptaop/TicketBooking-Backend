# Architecture Decision Records

One file per significant decision: the context, the options, the choice, and
what it costs. An ADR is never edited to change its decision; a later ADR
supersedes it.

| # | Decision | Status |
|---|---|---|
| [001](001-modular-monolith-with-schema-per-context.md) | Modular monolith first, one Postgres schema per bounded context | Accepted |
| [002](002-jwt-access-token-and-rotating-refresh-token-in-cookies.md) | Short JWT access token + rotating opaque refresh token, both in httpOnly cookies | Accepted |
| [003](003-check-the-session-on-every-request.md) | The auth guard checks the session on every request | Accepted (amends 002) |
| [004](004-contact-verification-with-hashed-one-time-codes.md) | Email/phone verification and password reset with hashed 6-digit codes | Accepted |
| [005](005-transactional-outbox-for-domain-events.md) | Domain events leave through a transactional outbox | Accepted |
| [006](006-admins-by-super-admin-approval.md) | Three roles; admins only by super-admin approval | Accepted |
| [007](007-in-process-housekeeping-job.md) | In-process timer for deleting dead identity rows | Accepted |

Template: [000-template.md](000-template.md)
