# Ticket Booking Platform — Requirements

Source: *Ticket Booking Platform: Learning and Build Roadmap* (Nov 12, 2026).
This file is the single source of truth for scope. Design rationale lives in `docs/adr/`.

---

## 1. Goal

Build one flow deeply — **hold seats → pay → confirm → notify** — as a DDD modular monolith in NestJS, then split it into **5 services + 1 gateway**. Every trade-off must be explainable (it is an interview/portfolio project).

### Guiding rules
1. **Design before code.** Phase 0 produces a glossary, domain map, diagrams — no code.
2. **Monolith first, then split.** One NestJS app with strict module boundaries; extract services in Phase 5 (week 8).
3. **Write down every decision.** One short ADR per big choice (options, choice, cost). Target 8–10 ADRs in `docs/adr/`.

### Assumptions
- Backend: NestJS + TypeScript (modules, DI, `@nestjs/cqrs`).
- Frontend: Next.js for the user site and the admin panel.
- ~10 weeks at 2–3 h/day (4‑week fallback in §10).

---

## 2. Functional scope

| # | Feature | Notes |
|---|---------|-------|
| F1 | Authentication | Signup, login, short-lived JWT access token, rotating refresh token in httpOnly cookie, roles `USER` / `ADMIN` |
| F2 | Movies (catalog) | Admin CRUD. A movie needs runtime, language, certificate before it can be scheduled |
| F3 | Theatres & screens | Admin CRUD; a screen owns its seat layout |
| F4 | Seat layouts | Seat numbers unique per screen; layout with future shows cannot be deleted; seat categories |
| F5 | Show scheduling — manual | Admin creates a show on a screen with price per seat category |
| F6 | Show scheduling — automatic | Admin gives movie, screen, date range, first/last show time; `ShowScheduler` builds slots from runtime + cleaning gap; rejects overlaps |
| F7 | Listing | Shows by city, date, movie; Redis-cached, invalidated on `ShowScheduled` / `ShowCancelled`. Postgres full-text search for movies |
| F8 | Seat map (live) | Socket.IO + Redis adapter; updates for everyone viewing a show |
| F9 | Seat locking / hold | Max 10 seats per booking; all-or-nothing; hold lasts 10 minutes |
| F10 | Booking | State machine, confirmed only after payment |
| F11 | Payment | Stripe (test mode) behind a `PaymentGateway` interface; PaymentIntent creation, webhook with `Stripe-Signature` verification |
| F12 | Cancellation & refund | `RefundPolicy` in Booking domain (e.g. full >24h before show, 50% until 2h before, none after) |
| F13 | Notifications | Email ticket with QR code; show reminders; in-app notifications; retry with backoff, DLQ after 3 failures |
| F14 | Reviews & ratings | One review per user per movie; only users with a confirmed booking for a finished show; avg rating recalculated on `ReviewPosted` and cached in Redis |
| F15 | Admin panel | Next.js admin for movies, theatres, screens, layouts, shows |
| F16 | Deployment | Docker Compose → CI/CD → Kubernetes |

---

## 3. Domain model (bounded contexts)

| Context | Type | Aggregate roots | Invariants | Events published |
|---|---|---|---|---|
| **Identity** | Generic | `User` | Email unique. Only admins reach admin APIs | `UserRegistered` |
| **Catalog** | Supporting | `Movie` | Runtime, language, certificate required before scheduling | `MovieAdded` |
| **Venue** | Supporting | `Theatre`, `Screen` (owns seat layout) | Seat numbers unique within a screen. Layout with future shows cannot be deleted | `ScreenLayoutChanged` |
| **Scheduling** | Supporting | `Show` | Shows on one screen never overlap (incl. cleaning gap). Show needs a price per seat category | `ShowScheduled`, `ShowCancelled` |
| **Booking** | **Core** | `Booking`, `ShowSeat` | A seat for a show is sold at most once. Hold ends after 10 min. Booking confirmed only after payment. ≤ 10 seats per booking | `SeatsHeld`, `BookingConfirmed`, `BookingExpired`, `BookingCancelled`, `BookingRejected` |
| **Payment** | Generic | `Payment` (owns refunds) | Booking charged once. Total refunds ≤ amount paid | `PaymentSucceeded`, `PaymentFailed`, `RefundProcessed` |
| **Notification** | Generic | none (reacts only) | Each event sends at most one message | — |
| **Review** | Supporting | `Review` | One review per user per movie; reviewer must have a confirmed booking for a finished show | `ReviewPosted` |

### Ubiquitous language
Use: **Show, Screen, Seat, ShowSeat, SeatHold, Booking, Payment, Refund**. Never "Order" or "Item".
- *Seat* (Venue) = a physical chair (row G, number 12, recliner).
- *ShowSeat* (Booking) = that chair for one show, with price and status.

### Key modelling decision
`ShowSeat` is its own small aggregate in Booking, **not** a child of `Show`. Booking consumes `ShowScheduled` and creates one `ShowSeat` row per seat, so users only contend when they want the same seat.

### Aggregate rules
- Keep aggregates small; reference other aggregates **by id only**.
- One transaction changes one aggregate; everything else via domain events (eventual consistency).
- Use factories (`Booking.create()`) so invalid aggregates can't exist.

### Value objects (examples)
`Money(amount, currency)`, `SeatNumber(row, number)` / `SeatRef`, `TimeSlot(start, end)`, `HoldWindow`.

---

## 4. State machines (enforced in domain layer; illegal transition throws)

- **ShowSeat:** `AVAILABLE → HELD` (select) · `HELD → BOOKED` (payment succeeded) · `HELD → AVAILABLE` (hold expired / payment failed) · `BOOKED → AVAILABLE` (booking cancelled)
- **Booking:** `PENDING → CONFIRMED` · `PENDING → EXPIRED` · `PENDING → FAILED` · `CONFIRMED → CANCELLED`
- **Payment:** `CREATED → SUCCEEDED | FAILED` · `SUCCEEDED → PARTIALLY_REFUNDED | REFUNDED`

---

## 5. Target architecture

Two Next.js apps → one NestJS API gateway → 5 services sharing **one PostgreSQL database, with one schema per bounded context** (see §5.1). Services never read each other's schemas; they communicate via events on RabbitMQ (sync REST calls kept rare).

| Service | Contexts |
|---|---|
| `identity-service` | Identity |
| `catalog-service` | Catalog, Venue, Scheduling, Review (separate modules) |
| `booking-service` | Booking (scales independently) |
| `payment-service` | Payment |
| `notification-service` | Notification |
| `gateway` | JWT verification, rate limiting (Redis, per user & IP), routing |

### 5.1 Data ownership: one database, schema per context

A single PostgreSQL database (`ticket_booking`) with one schema per bounded context. Each schema is owned by exactly one module/service.

| Schema | Owner module → service | Example tables |
|---|---|---|
| `identity` | identity → identity-service | `users`, `refresh_tokens` |
| `catalog` | catalog → catalog-service | `movies` |
| `venue` | venue → catalog-service | `theatres`, `screens`, `seats` |
| `scheduling` | scheduling → catalog-service | `shows`, `show_prices` |
| `booking` | booking → booking-service | `bookings`, `booking_seats`, `show_seats`, `outbox`, `processed_events`, `idempotency_keys` |
| `payment` | payment → payment-service | `payments`, `refunds`, `outbox`, `processed_events`, `idempotency_keys` |
| `notification` | notification → notification-service | `notifications`, `processed_events` |
| `review` | review → catalog-service | `reviews`, `movie_ratings` |

Rules:
- Every TypeORM entity declares its schema: `@Entity({ schema: 'booking', name: 'show_seats' })`.
- **No cross-schema joins, foreign keys or queries.** Other contexts are referenced by id only (e.g. `show_seats.show_id` is a plain `uuid`, not an FK to `scheduling.shows`). Data from another context arrives via events or an application port.
- Each module owns its migrations, which only touch its own schema.
- Outbox / `processed_events` / idempotency tables live inside each owning schema, so the state change and its event commit in the same transaction.
- Optional hardening (Phase 5+): one DB role per service with `USAGE` only on its own schema, so a cross-schema read fails at the database.
- Why (ADR): one database is cheaper to run and back up, while schemas keep the ownership boundaries visible and enforceable. Moving a schema to its own database later is a dump-and-restore, with no code changes beyond the connection string.

### Tech stack

| Area | Choice |
|---|---|
| Repo | Monorepo, pnpm workspaces + Turborepo (shared event contracts/types) |
| Frontend | Next.js App Router, TypeScript, Tailwind, TanStack Query |
| Sync calls | REST; gRPC for one call as stretch |
| Events | RabbitMQ |
| Database | One PostgreSQL database, one schema per bounded context; TypeORM (entities + versioned migrations) |
| Cache / locks | Redis |
| Delayed jobs | RabbitMQ delay queues: per-message TTL + dead-letter exchange (or the `rabbitmq_delayed_message_exchange` plugin) for hold expiry, reminders, email retries |
| Realtime | Socket.IO + Redis adapter |
| Payments | Stripe test mode behind `PaymentGateway` |
| Search | Postgres full-text (OpenSearch stretch only) |
| Observability | pino JSON logs + correlation id, OpenTelemetry, Prometheus, Grafana |
| Testing | Jest (domain), Testcontainers (DB), k6 (load) |
| Delivery | Docker, GitHub Actions, Kubernetes (k3s / managed) |

---

## 6. The hard problems (must be solved and proven)

### 6.1 Concurrent seat selection
1. Redis hold: `SET hold:{showId}:{seatId} {bookingId} NX EX 600`.
2. Multiple seats atomically via a **Lua script** (all or none).
3. DB guard: `UPDATE show_seat SET status='HELD' WHERE id=? AND status='AVAILABLE'` + `version` column (optimistic locking). 0 rows ⇒ lost.
4. Expiry: publish a `BookingHoldExpiryDue` message to a RabbitMQ delay queue (TTL 10 min → dead-letter to the expiry queue). The consumer marks the Booking `EXPIRED` (only if still `PENDING`), frees seats in DB, pushes a WebSocket update.

**Proof:** 200 concurrent requests for one seat ⇒ exactly one success; repeat with 3 booking-service replicas.

### 6.2 Booking ↔ payment saga (choreography)
1. Hold seats; create `Booking` `PENDING` with expiry.
2. Client asks Payment to create a Stripe PaymentIntent for the booking id (`bookingId` in metadata, idempotency key = booking id).
3. User pays with Stripe Payment Element / Checkout.
4. Webhook → verify signature → `Payment SUCCEEDED` → publish `PaymentSucceeded`.
5. Booking → seats `BOOKED`, booking `CONFIRMED` → publish `BookingConfirmed`.
6. Notification → email ticket with QR.

Failure paths:
- Payment fails / user leaves ⇒ hold expires, booking `EXPIRED`, seats freed.
- Payment succeeds after hold expired ⇒ Booking publishes `BookingRejected` ⇒ Payment refunds (compensating action).
- Duplicate webhook ⇒ ignored.

### 6.3 Transactional outbox
Insert the event into an `outbox` table in the same DB transaction as the state change; a relay publishes to RabbitMQ and marks rows sent. At-least-once, never zero.

### 6.4 Idempotency
- `Idempotency-Key` header on create-booking and create-payment; store key + response; replay returns stored response.
- Every event has a unique id; each consumer keeps `processed_events` and skips seen ids.
- Unique constraint on `payment(booking_id)` for successful payments.

### 6.5 Cancellation & refund
`booking.cancel(now)` checks state, asks `RefundPolicy` for amount, raises `BookingCancelled`. Payment refunds via gateway; Booking frees seats; Notification emails user.

### 6.6 Automatic scheduling
`ShowScheduler` domain service; DB guard with exclusion constraint:
`EXCLUDE USING gist (screen_id WITH =, tstzrange(start, end) WITH &&)`.

**Proof:** overlapping show creation fails at both domain and DB level.

---

## 7. Low-level design rules

Hexagonal / ports-and-adapters, dependencies point inward:
`presentation` & `infrastructure` → `application` → `domain` → nothing.

```
src/<context>/
  domain/            pure TS — no NestJS, TypeORM, Redis imports
    *.aggregate.ts, value-objects/, events/, policies/, *.repository.ts (port interface)
  application/
    commands/        *.handler.ts (use cases: load → call domain → save → publish)
    queries/         read models (flat rows, light CQRS)
    ports/           seat-lock.port.ts, event-publisher.port.ts, ...
  infrastructure/
    persistence/     *.orm-entity.ts, typeorm-*.repository.ts, *.mapper.ts
    redis/, messaging/ (outbox relay, consumers)
  presentation/      controllers, dto/, websocket gateways
```

- **Rich domain model**: business rules live in aggregates, never set status from outside.
- **Patterns**: State (status transitions), Strategy (refund policy, pricing), Factory, Repository (one per aggregate root), Adapter (Stripe, Redis, RabbitMQ, Mailer), Observer (domain events), light CQRS via `@nestjs/cqrs`.
- **Error model**: domain errors mapped to HTTP status codes in one place (exception filter).

### LLD deliverables
Class diagram (Booking context), state diagrams, ER diagram per service (indexes + constraints), Swagger per service, event catalogue (name, fields, publisher, consumers).

---

## 8. Non-functional requirements

- Stateless services (locks in Redis/Postgres, not memory).
- Health and readiness endpoints on every service.
- Graceful shutdown (finish in-flight requests and jobs).
- Config only via environment variables; secrets never in git.
- Versioned DB migrations run by the pipeline.
- Timeouts + retries with backoff on every network call.
- Notification consumers: retry with backoff, DLQ after 3 failures.
- Correlation id propagated through gateway → booking → payment → notification.
- Rate limiting at the gateway (per user and per IP, Redis).

### Scalability to demonstrate
Listing latency before/after Redis cache; `EXPLAIN ANALYZE` before/after indexes; k6 full-flow script (RPS + p95); 3 booking replicas still give one winner.

### Scalability to discuss only
Read replicas, partitioning `ShowSeat` by show date, virtual waiting room, CDN, Kafka vs RabbitMQ, multi-region.

---

## 9. Build plan & acceptance criteria

| Phase | Weeks | Build | Done when |
|---|---|---|---|
| 0. Design | 1 | Glossary, context map, aggregates + invariants, HLD diagram, ADR‑001 (modular monolith first) | Can explain every aggregate boundary in 5 min |
| 1. Foundation | 2–3 | Monorepo; NestJS app with Identity, Catalog, Venue modules; signup/login/refresh rotation/roles; admin APIs for movies, theatres, screens, layouts; Docker Compose | Domain unit tests run with no DB; Swagger shows all APIs; `docker compose up` starts everything |
| 2. Scheduling & listing | 4 | Show aggregate, overlap rule, auto scheduler, listing by city/date/movie, Next.js admin panel | Overlapping shows rejected at domain **and** DB level |
| 3. Booking core | 5–6 | ShowSeat creation from `ShowScheduled`, seat hold, Booking state machine, hold expiry, live seat map | 200 parallel requests → exactly one wins; hold frees after 10 min |
| 4. Payment & cancellation | 7 | Stripe test mode, payment module, confirm flow, late-payment refund, cancellation + refund policy, QR ticket email | Kill app between payment and confirmation, restart → booking still confirms |
| 5. Split into services | 8 | Extract notification → payment → booking; gateway; shared events package | Stop notification-service, book, restart → email still arrives |
| 6. Reviews & observability | 9 | Reviews/ratings, in-app notifications, correlation ids, dashboards, rate limiting | One booking visible as a single trace across gateway, booking, payment, notification |
| 7. Deploy & present | 10 | CI pipeline, deployment, load test, README, demo video | Live URL, load test graph, rehearsed 2‑min walkthrough |

Don't start a phase until the previous phase's proof passes. Each phase ends with a demo and an ADR.

---

## 10. 4‑week fallback
Phases 0–4 as a modular monolith; extract only `notification-service`; deploy with Docker Compose on one server. Keep DDD, seat locking, the saga and the outbox.

---

## 11. Deployment levels
1. **Minimum** — all services in Docker Compose on one server behind Caddy/Nginx with HTTPS; Next.js apps on Vercel.
2. **Pipeline** — GitHub Actions: lint, test, build images, push to registry, run migrations, deploy on merge to `main`.
3. **Kubernetes** — k3s or managed; one Deployment per service, health probes, ConfigMaps/Secrets, HPA on booking-service.

---

## 12. Final deliverables
- Live URL with seeded demo user and admin accounts.
- README: architecture diagram, how to run, hard problems and how each is solved, cache/index/load-test numbers.
- `docs/adr/` with 8–10 ADRs.
- Concurrency test output and k6 results.
- 3‑minute demo video (two browsers fighting for one seat).
- Clean git history with small, meaningful commits.
- Written answers to the 10 interview questions (see roadmap).
