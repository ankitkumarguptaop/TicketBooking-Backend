# 004. Email/phone verification and password reset with hashed 6-digit codes

- **Status:** Accepted
- **Date:** 2026-11-25
- **Context:** identity

## Context
Typing an address proves nothing. Sign-in must require a verified email, the
phone can be verified optionally, and a forgotten password needs a reset path
that doesn't reveal which emails have accounts.

## Options
1. **Magic links with a long token.** Phishing-friendly look, awkward on
   another device, the token sits in mail logs and browser history.
2. **6-digit codes**, stored as HMAC with a pepper, scoped to user + purpose.

## Decision
Option 2, one `VerificationCode` aggregate for all purposes (EMAIL, PHONE,
PASSWORD_RESET): valid 10 min, 5 attempts, resend after 60 s, single use,
bound to the destination it was sent to. Before the first sign-in, a
short-lived `verification_token` cookie (30 min, path `/auth/verification`)
authorises the verification endpoints instead of a session. Password reset
always answers the same 200, whether or not the email exists.

## Consequences
- 5 guesses at 1/1,000,000 each: brute force is not practical per code.
- Reset signs out every session; "change password" keeps the current one.
- **Cost:** a user can request new codes repeatedly; without rate limiting
  (not built yet) that allows slow guessing and inbox/SMS spam.
- **Cost:** SMS delivery is a log-only adapter in dev; a provider is still needed.
