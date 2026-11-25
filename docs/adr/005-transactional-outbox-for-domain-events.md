# 005. Domain events leave through a transactional outbox

- **Status:** Accepted
- **Date:** 2026-11-25
- **Context:** identity (pattern for every context)

## Context
Handlers used to "save, then publish". A crash or failure between the two
leaves a state change without its event, for example an approved admin
request whose user never becomes ADMIN. The project rule "one transaction
modifies one aggregate" makes events the only way to update a second
aggregate, so losing one is a correctness bug, not a missed notification.

## Options
1. **Save then publish (in-process).** Simple; events can be lost.
2. **Publish then save.** Consumers can act on a change that was rolled back.
3. **Distributed transaction (2PC) with the broker.** Heavy, poorly supported.
4. **Transactional outbox:** write events to a table in the same transaction
   as the aggregate; a relay publishes them afterwards.

## Decision
Option 4, inside each context's own schema (`identity.outbox`). Repositories
write the aggregate and `pullDomainEvents()` in one transaction; handlers no
longer publish. `OutboxRelay` publishes oldest-first with
`FOR UPDATE SKIP LOCKED`, when nudged after a commit and on a 1 s poll. Events
are rebuilt from a name → class registry, keeping their original `eventId`.

## Consequences
- An event is stored if and only if its change is committed.
- Delivery is **at least once**: every consumer must be idempotent.
- **Cost:** an extra insert per save, a table to clean up (ADR 007), and up to
  a poll interval of delay if a nudge is missed.
- **Cost:** with the in-process bus, a consumer that throws isn't redelivered;
  handlers retry, are idempotent, and can be replayed by clearing
  `published_at`. RabbitMQ acknowledgements close this in Phase 3/5, by
  changing only the relay's publish step.
