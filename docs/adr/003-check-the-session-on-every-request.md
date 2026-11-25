# 003. The auth guard checks the session on every request

- **Status:** Accepted (amends 002)
- **Date:** 2026-11-25
- **Context:** identity

## Context
With signature-only verification, an access token keeps working for up to
15 minutes after logout, "sign out that device", a password reset, or an
admin being demoted. For a booking/payment platform that window is too long.

## Options
1. **Signature only.** Zero DB hits; revocation lags up to 15 min.
2. **Redis denylist of revoked session ids.** One Redis GET per request; needs
   Redis (arrives later) and a TTL per entry.
3. **Look up the session (`sid`) by primary key on every request.**

## Decision
Option 3 now: `JwtAuthGuard` loads `identity.user_sessions` by `sid` and
answers `401 AUTH_SESSION_REVOKED` if it is missing, someone else's, revoked
or expired. A Server-Sent Events stream (`/auth/sessions/events`) pushes
`session-revoked` to the affected device immediately.

## Consequences
- Logout, revoke-one, logout-all, password reset and admin demotion take
  effect on the very next request.
- **Cost:** one indexed Postgres read per authenticated request. Negligible at
  this scale; move it to Redis (option 2) when it shows up in profiles.
- **Cost:** in Phase 5 every service would need this check; the gateway will
  do it once instead.
- The role is still taken from the token, so promotions appear at the next refresh.
