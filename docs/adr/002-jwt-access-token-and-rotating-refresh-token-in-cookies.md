# 002. Short JWT access token + rotating opaque refresh token, both in httpOnly cookies

- **Status:** Accepted (the access-token check is amended by [003](003-check-the-session-on-every-request.md))
- **Date:** 2026-11-25
- **Context:** identity

## Context
Users stay signed in across days and devices. Tokens must not be readable by
injected JavaScript, a stolen token must be detectable, and every other
context (and later every service) must be able to check identity cheaply.

## Options
1. **Long-lived JWT in `localStorage`.** Simple; XSS steals it, and it can't be revoked.
2. **Classic server session id in a cookie.** Revocable; every request hits a
   shared store, and every future service would have to call identity.
3. **Short JWT access (15 min) + opaque refresh token, rotated on every use,
   one session ("token family") per device, both in httpOnly cookies.**

## Decision
Option 3:
- Access token: HS256 JWT, 15 min; `alg`, `iss`, `aud` pinned on verify.
- Refresh token: `<sessionId>.<256-bit secret>`, stored only as
  HMAC-SHA256 with a pepper; single use; replaying an old one revokes the
  session (RFC 9700 §4.14 reuse detection). Idle 7 d / absolute 30 d.
- Cookies: access `SameSite=Lax; Path=/`, refresh `SameSite=Strict; Path=/auth`.
- Concurrent refreshes are serialised by an optimistic lock; the loser revokes.

## Consequences
- XSS can't exfiltrate tokens; theft of a refresh token becomes visible.
- Per-device sessions give "where am I signed in" and per-device logout.
- **Cost:** two tabs refreshing at the same instant log the user out; the
  frontend must serialise refreshes across tabs.
- **Cost:** CSRF must be handled (SameSite; GET never changes state).
- Revisit in Phase 5: RS256 + JWKS so services verify without the signing key.
