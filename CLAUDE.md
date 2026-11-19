# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

Backend for a **movie ticket booking platform**, built as a learning/portfolio project in **NestJS + TypeScript** using **Domain-Driven Design** and hexagonal architecture. Full scope, domain model, hard problems and phase plan: **[docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)** — read it before making design decisions.

Core flow to get right: **hold seats → pay → confirm → notify**.

### Current state
- Fresh NestJS 11 scaffold (`src/app.*`), npm (`package-lock.json`), Jest, ESLint, Prettier.
- Strategy: **modular monolith first** (one NestJS app, strict module boundaries), split into 5 services + gateway in Phase 5. Do not introduce microservices, RabbitMQ or a monorepo split before the plan calls for it.

## Commands

```bash
npm run start:dev      # dev server with watch
npm run build
npm run lint           # eslint --fix
npm run format         # prettier
npm test               # unit tests (src/**/*.spec.ts)
npm run test:e2e       # e2e (test/jest-e2e.json)
npm run test:cov
```

## How Claude should help (important)

This is a **learning project**; the developer must be able to explain every line in an interview.

**The developer writes these themselves — Claude reviews, explains, gives hints, but does not write the implementation unless explicitly asked:**
- Domain layer: aggregates, value objects, policies, domain events, state machines
- Seat lock logic and the Redis Lua script
- Saga handlers, outbox relay, idempotency logic
- Diagrams and ADRs

**Fine for Claude to write (developer reads every line):**
- DTOs, validation decorators, Swagger annotations
- Dockerfiles, docker-compose, CI workflows
- Test scaffolding, seed data
- Boilerplate wiring (modules, providers, controllers that only delegate)

When asked to review: point to lines and explain which rule is broken; don't silently rewrite. When asked for help on a bug: prefer one hint over the full fix unless the developer asks for the answer.

## Architecture rules

### Bounded contexts (modules under `src/`)
`identity`, `catalog`, `venue`, `scheduling`, `booking` (core), `payment`, `notification`, `review`.
Modules **must not** import another module's domain or infrastructure, or read its tables. Cross-context communication is via domain events (in-process event bus now, RabbitMQ later) or a narrow application-layer port.

### Layers inside each context
```
src/<context>/
  domain/          pure TypeScript — NO @nestjs/*, Prisma, Redis, or other framework imports
  application/     commands/, queries/ (use-case handlers), ports/ (interfaces)
  infrastructure/  persistence/ (Prisma repos + mappers), redis/, messaging/
  presentation/    controllers, dto/, websocket gateways
```
Dependencies point inward only: presentation/infrastructure → application → domain.

### DDD conventions
- **Rich model**: business rules and state transitions live in the aggregate (`booking.confirm()`, `booking.cancel(now)`). Never set `status` from outside. Illegal transitions throw domain errors.
- Aggregates are small and reference each other **by id only**. One transaction modifies one aggregate; the rest happens via domain events.
- Create aggregates through factories (`Booking.create(...)`) so invalid state can't exist.
- Value objects are immutable (`Money`, `SeatRef`, `TimeSlot`, `HoldWindow`).
- Repository interface lives in `domain/`; Prisma implementation in `infrastructure/persistence/`.
- Application handlers: load → call domain → save → publish events. No business rules in handlers.
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
PostgreSQL + Prisma · Redis (holds, cache, rate limit) · BullMQ (hold expiry, reminders, email retry) · Socket.IO + Redis adapter (live seat map) · Razorpay test mode behind a `PaymentGateway` port · JWT access + rotating httpOnly refresh token, roles `USER`/`ADMIN` · pino logs with correlation id · Jest + Testcontainers + k6.

## Coding conventions
- TypeScript strict; no `any` in domain code.
- File naming: `booking.aggregate.ts`, `money.vo.ts` or `value-objects/money.ts`, `booking-confirmed.event.ts`, `hold-seats.handler.ts`, `prisma-booking.repository.ts`, `redis-seat-lock.adapter.ts`.
- Domain unit tests must run without a database.
- Config only from environment variables (`@nestjs/config`); never commit secrets or `.env`.
- Every network call has a timeout and retry with backoff.
- Small, meaningful commits.

## Docs
- `docs/REQUIREMENTS.md` — scope and acceptance criteria per phase
- `docs/adr/NNN-title.md` — one ADR per significant decision (options, choice, cost)
