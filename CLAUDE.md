# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

Backend for a **movie ticket booking platform**, built as a learning/portfolio project in **NestJS + TypeScript** using **Domain-Driven Design** and hexagonal architecture. Full scope, domain model, hard problems and phase plan: **[docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)** — read it before making design decisions.

Core flow to get right: **hold seats → pay → confirm → notify**.

### Current state
- NestJS 11, npm (`package-lock.json`), Jest, ESLint, Prettier. `identity` is built; other contexts not started.
- Strategy: **modular monolith first** (one NestJS app, strict module boundaries), split into 5 services + gateway in Phase 5. Do not introduce microservices or a monorepo split before the plan calls for it. RabbitMQ arrives in Phase 3 for delayed jobs (hold expiry) and becomes the service-to-service event bus in Phase 5.

## Commands

```bash
npm run start:dev      # dev server with watch
npm run build
npm run lint           # eslint --fix
npm run format         # prettier
npm test               # unit tests (src/**/*.spec.ts)
npm run test:e2e       # e2e (test/jest-e2e.json)
npm run test:cov

npm run migration:run       # apply pending migrations
npm run migration:revert    # undo the last one
npm run migration:show      # list applied / pending
npm run migration:generate -- src/<context>/infra/migrations/<Name>
                            # diff entities vs DB into a new migration (review it before committing)
```

DB config is one factory, `typeOrmConfig(contextName)` in `src/shared/infra/database/typeorm.config.ts` (`'default'` = all contexts). Prefix any `migration:*` command with `DB_CONTEXT=<context>` to load only that context's entities and migrations.

Migrations live per context in `src/<context>/infra/migrations/` and touch only that context's schema. `DB_SYNCHRONIZE` stays `false`.

## How Claude should help (important)

This is a **learning project**; the developer must be able to explain every line in an interview.

**The developer writes these themselves — Claude reviews, explains, gives hints, but does not write the implementation unless explicitly asked:**
- Domain layer: aggregates, value objects, policies, domain events, state machines
- Seat lock logic and the Redis Lua script
- Saga handlers, outbox relay, idempotency logic
- Diagrams and ADRs

**Fine for Claude to write (developer reads every line):**
- DTOs, validation decorators
- Dockerfiles, docker-compose, CI workflows
- Test scaffolding, seed data
- Boilerplate wiring (modules, providers, controllers that only delegate)

When asked to review: point to lines and explain which rule is broken; don't silently rewrite. When asked for help on a bug: prefer one hint over the full fix unless the developer asks for the answer.

## Architecture rules

### Bounded contexts (modules under `src/`)
`identity`, `catalog`, `venue`, `scheduling`, `booking` (core), `payment`, `notification`, `review`.
Modules **must not** import another module's domain, infra or features, or read its tables.

**Database:** one PostgreSQL database, **one schema per bounded context**, with the same names as the modules above. Every entity sets its schema (`@Entity({ schema: 'identity', name: 'users' })`). No cross-schema joins, foreign keys or queries: reference other contexts by id only. A module's migrations touch only its own schema. See `docs/REQUIREMENTS.md` §5.1. Cross-context communication is via domain events (in-process event bus now, RabbitMQ later) or a narrow port.

### Layout inside each context (vertical slices — full tree in `docs/REQUIREMENTS.md` §7)
```
src/<context>/
  domain/            pure TypeScript — NO @nestjs/*, TypeORM, Redis, or other framework imports
    *.aggregate.ts, value-objects/, events/, policies/, errors/
    ports/           every interface the features depend on: *.repository.ts, *.port.ts
  infra/             adapters that implement the ports
    entities/        *.orm-entity.ts (TypeORM, each sets its own schema)
    repository/      typeorm-*.repository.ts, typeorm-*.read-model.ts
    mappers/         *.mapper.ts (orm-entity <-> aggregate)
    migrations/      this context's migrations only
    messaging/       outbox writer + relay (outbox table is per context), email/SMS adapters
    redis/, security/, http/ (context-wide guards, cookies, pipes)
    <context>-infra.module.ts   binds ports → adapters, exports what features inject
  features/<use-case>/          one NestJS module per use case
    <use-case>.controller.ts    (several if the use case has several entry points)
    <use-case>.command.ts | .query.ts, <use-case>.handler.ts, *.dto.ts, *.view.ts
    <use-case>.module.ts        imports <context>-infra.module, declares controller + handler
  <context>.module.ts           imports the infra module + every feature module
src/shared/
  domain/            shared kernel (AggregateRoot, DomainEvent, DomainError, UserRole)
  infra/auth/        JwtAuthGuard, RolesGuard, @CurrentUser, @Roles (global AuthModule)
  infra/database/, infra/http/ (DomainErrorFilter), infra/messaging/
  features/health/
  shared.module.ts
```
Dependencies point inward only: features/infra → domain. `shared/` never imports a context; a context plugs into `shared/` through a port (e.g. `ActiveSessionChecker`, wired in `app.module.ts`). A feature may import another feature's command/query/view/DTO classes, never its handler.

### DDD conventions
- **Rich model**: business rules and state transitions live in the aggregate (`booking.confirm()`, `booking.cancel(now)`). Never set `status` from outside. Illegal transitions throw domain errors.
- Aggregates are small and reference each other **by id only**. One transaction modifies one aggregate; the rest happens via domain events.
- Create aggregates through factories (`Booking.create(...)`) so invalid state can't exist.
- Value objects are immutable (`Money`, `SeatRef`, `TimeSlot`, `HoldWindow`).
- Repository interface lives in `domain/ports/`; TypeORM implementation in `infra/repository/`.
- Feature handlers: load → call domain → save. The repository writes the aggregate's events to the context's outbox in the same transaction; a relay publishes them (ADR 005). No business rules in handlers.
- Light CQRS via `@nestjs/cqrs`: commands mutate aggregates; queries read flat rows directly.
- Domain errors are mapped to HTTP status codes in **one** exception filter.
- Pass `now: Date` into domain methods instead of calling `new Date()` inside the domain (testability).

### Ubiquitous language
Use **Show, Screen, Seat, ShowSeat, SeatHold, Booking, Payment, Refund**. Never "Order" or "Item". Events are past tense (`SeatsHeld`, `BookingConfirmed`, `PaymentSucceeded`, `BookingRejected`).

### Non-negotiable invariants
- A seat for a show is sold at most once (Redis `SET NX EX` + Lua for multi-seat, **and** conditional `UPDATE ... WHERE status='AVAILABLE'` with a `version` column).
- Seat hold lasts 10 minutes; max 10 seats per booking.
- Booking is confirmed only after payment; a late payment triggers `BookingRejected` → refund.
- Shows on one screen never overlap incl. cleaning gap (domain check + Postgres `EXCLUDE USING gist` on `tstzrange`).
- Total refunds ≤ amount paid; a booking is charged once.
- State changes and their events are written in the same transaction (outbox table).
- Consumers are idempotent (`processed_events`); create-booking/create-payment honour `Idempotency-Key`.

## Tech stack
PostgreSQL (one DB, schema per context) + TypeORM · Redis (holds, cache, rate limit) · rabbitmq (hold expiry, reminders, email retry) · Socket.IO + Redis adapter (live seat map) · Stripe test mode behind a `PaymentGateway` port · JWT access + rotating httpOnly refresh token, roles `USER` < `ADMIN` < `SUPER_ADMIN` (one seeded super admin approves admins, ADR 006) · pino logs with correlation id · Jest + Testcontainers + k6.

## Coding conventions
- TypeScript strict; no `any` in domain code.
- File naming: `booking.aggregate.ts`, `money.vo.ts` or `value-objects/money.ts`, `booking-confirmed.event.ts`, `hold-seats.handler.ts`, `booking.orm-entity.ts`, `typeorm-booking.repository.ts`, `redis-seat-lock.adapter.ts`.
- Domain unit tests must run without a database.
- Config only from environment variables (`@nestjs/config`); never commit secrets or `.env`.
- Every network call has a timeout and retry with backoff.
- Small, meaningful commits.

## Docs
- `docs/REQUIREMENTS.md` — scope and acceptance criteria per phase
- `docs/adr/NNN-title.md` — one ADR per significant decision (options, choice, cost)
