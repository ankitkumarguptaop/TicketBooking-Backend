# 001. Modular monolith first, one Postgres schema per bounded context

- **Status:** Accepted
- **Date:** 2026-11-25
- **Context:** all

## Context
The platform has eight bounded contexts (identity, catalog, venue, scheduling,
booking, payment, notification, review). The end goal (Phase 5) is five
services behind a gateway. Building services from day one would mean solving
deployment, service discovery and distributed transactions before the domain
is even understood.

## Options
1. **Microservices from the start.** Real boundaries, but slow to build and
   every mistake in a boundary is expensive to move.
2. **Plain monolith, shared tables.** Fastest, but contexts would read each
   other's tables and the later split would be a rewrite.
3. **Modular monolith, one schema per context.** One NestJS app; each context
   is a module that never imports another's domain/infrastructure and only
   touches its own schema.

## Decision
Option 3. One database, one schema per context with the module's name
(`identity`, `catalog`, …). No cross-schema joins or foreign keys; other
contexts are referenced by id. Cross-context communication goes through
domain events or a narrow application-layer port.

## Consequences
- Each context can be lifted into its own service in Phase 5 with its schema.
- Migrations live per context and touch only that context's schema.
- **Cost:** no database-level referential integrity across contexts (e.g. a
  booking's `user_id`); consistency between contexts is eventual, through events.
- **Cost:** discipline is enforced by review, not by the compiler. Optional
  hardening: one DB role per context with `USAGE` on its own schema only.
