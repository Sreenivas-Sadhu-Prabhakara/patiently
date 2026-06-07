# Architecture

Patiently is a **modular monorepo** with three deployable tiers plus a shared
contract package. Boundaries are deliberately strict so any tier can be split
into its own repository/service later with no rewrite.

```
        ┌──────────────┐      HTTPS/JSON      ┌────────────────┐    facade    ┌──────────────┐
clients │   frontend   │ ───────────────────▶ │   middleware   │ ───────────▶ │   backend    │
(web,   │  React (SPA) │   the only API the   │ Fastify gateway│  in-process  │ domain core  │
 mobile)│ mobile-first │   clients ever call  │  (BFF / auth)  │  (or HTTP)   │              │
        └──────────────┘                      └────────────────┘              └──────┬───────┘
                                                                                     │
                          ┌──────────────────────────────────────────────────┬──────┴───────────────┐
                          ▼                         ▼                          ▼                      ▼
                    Repository              Store adapters             Frugality engine        Checkout provider
                 (JSON file → Postgres)  (Amazon.in/Flipkart/mock)   (pure, unit-tested)    (mock → Razorpay/UPI)

                       all four tiers share ◀── packages/shared (types + Zod schemas) ──▶
```

## Why a monorepo (and how it stays separable)

- **Single source of truth.** `@patiently/shared` defines every entity and API
  payload once as Zod schemas; types are derived (`z.infer`). The server validates
  with the same schemas the client is typed against — drift is impossible.
- **Atomic changes.** A contract change is one commit the whole stack type-checks.
- **Clean seams.** The frontend imports `@patiently/shared` _types only_; the
  middleware imports the backend only through the `Backend` facade
  (`apps/backend/src/container.ts`). Nothing reaches across a boundary into
  another tier's internals — so extracting a tier into its own repo is a
  package-move, not a refactor.

## Tiers

### `packages/shared`

Domain enums, entities, DTOs and response envelopes as Zod schemas + derived TS
types, plus money helpers. Money is integer **paise** everywhere; formatting to ₹
(en-IN, lakh/crore grouping) happens only at the UI edge. The `StoreId` enum is
the India lineup: `amazon_in`, `flipkart`, `croma`, `reliance_digital`,
`tata_cliq`, `myntra`.

### `apps/backend` — domain core

- **Repository** (`repository/`) — persistence behind an interface. Ships with a
  zero-dependency `JsonFileRepository`; swap for Postgres/Prisma in the container.
- **Store adapters** (`adapters/`) — a `StoreAdapter` interface with live
  Amazon.in (PA-API v5, SigV4-signed, `.in` host/region/marketplace) and Flipkart
  (Affiliate API) adapters, plus a deterministic `MockAdapter` (used for Croma,
  Reliance Digital, Tata CLiQ, Myntra). The **registry** picks the live adapter
  when its keys are present and falls back to mock otherwise — per store.
- **Frugality engine** (`engine/`) — pure landed-cost + ranking + proposal logic.
- **Services** (`services/`) — `WishService`, `SearchService` (the daily worker),
  `PurchaseService`, `UserService`, `NotificationService`.
- **Checkout** (`checkout/`) — `CheckoutProvider` interface + mock; the seam where
  real purchasing/payments plug in.
- **Container** (`container.ts`) — the composition root that wires concretes into
  services and returns the `Backend` facade.

### `apps/middleware` — API gateway / BFF

Fastify app: CORS, JWT auth, a unified error handler (Zod/domain errors → HTTP
codes), REST routes, and an optional in-process scheduler. Exposes
`POST /api/jobs/daily-search` (token-guarded) for an external cron. This is the
**only** surface clients touch.

### `apps/frontend` — mobile-first web client

Vite + React. A single typed `ApiClient` (reusable verbatim in React Native)
talks to the middleware. UI is a phone-shaped, card-based app.

## Key flows

**Daily search** (`SearchService.runForWish`): build a query → fan out to every
eligible adapter in parallel (failures isolated) → compute landed cost per offer
→ persist offers + an auditable `SearchRun` → rank → if the engine says "act",
create a `PurchaseDecision (proposed)`, move the wish to `awaiting_approval`, and
notify the user. Past-horizon wishes are expired with a grace period.

**Approve → buy** (`PurchaseService.decide`): user approves/rejects the pending
proposal. Approve → `purchasing` → `CheckoutProvider.placeOrder` → on success
`purchased` + confirmation notification; on failure, back to `active` to keep
hunting. We never buy without an explicit approval.

## Productionisation checklist

- **Payments & checkout (India)** — replace `MockCheckoutProvider` with real
  per-store purchase automation / partner APIs and an India payment stack:
  **UPI / cards / netbanking via Razorpay, PayU or Cashfree**, with RBI-compliant
  saved payment methods (tokenised cards / UPI AutoPay e-mandates for pre-approved
  spend), per-wish spend caps and fraud checks.
- **Persistence** — implement `Repository` over Postgres (Prisma); add migrations.
- **Search at scale** — move the worker to a queue (BullMQ/SQS) with per-store
  rate limiting, caching and backoff; keep the HTTP trigger for cron. Bias search
  frequency up around festive sales (Big Billion Days / Great Indian Festival).
- **Identity** — replace passwordless-by-email with mobile-number OTP (the Indian
  norm), magic links, or OAuth/passkeys.
- **Observability** — structured logs (already via Fastify/pino), metrics, tracing.
- **Compliance** — respect each store's API & affiliate terms; prefer official
  APIs over scraping; keep GST-inclusive landed-cost accuracy per destination PIN.
