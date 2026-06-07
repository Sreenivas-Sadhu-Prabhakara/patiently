# Patiently 🇮🇳

> Tell us what you want over the next **3–6 months**. We patiently hunt the
> cheapest **landed price** (price + shipping − discounts, GST-inclusive) across
> India's e-commerce stores every day, and buy it the moment **you approve**.

Patiently turns impulse buying into intentional buying. You declare an intent and
a horizon; a daily worker tracks the true cost-to-your-door across **Amazon.in,
Flipkart, Croma, Reliance Digital, Tata CLiQ and Myntra**; when the price is right
(under your budget, an unusually low dip, or the deadline is near) we surface a
one-tap **Approve & buy**.

India's festive sale calendar — **Flipkart Big Billion Days** and **Amazon Great
Indian Festival** around Sept–Nov, plus Republic Day and end-of-season sales —
makes patience especially valuable: declare what you want, and let Patiently wait
for the festive low instead of paying today's price.

This repository is the product MVP: a fully working, end-to-end stack that runs
today with **zero API keys** (seeded mock price feeds, priced in ₹) and upgrades
to **live e-commerce data one store at a time** as you add credentials. All money
is handled in paise and formatted as ₹ with Indian (lakh/crore) digit grouping.

---

## Architecture (3 separated tiers)

A monorepo with clean boundaries — each tier can be extracted into its own repo
without touching the others (see [ARCHITECTURE.md](./ARCHITECTURE.md)).

```
patiently/
├── packages/shared/      @patiently/shared      Domain types + Zod schemas (one source of truth)
├── apps/backend/         @patiently/backend     Domain core: repository · store adapters ·
│                                                frugality engine · purchase engine · daily-search worker
├── apps/middleware/      @patiently/middleware  Fastify API gateway / BFF: auth · validation ·
│                                                routing · scheduler — the only thing clients call
└── apps/frontend/        @patiently/frontend    Vite + React, mobile-first web client
```

Clients (web today, **React Native next** — see [MOBILE.md](./MOBILE.md)) talk
only to the middleware. The middleware depends on the backend through a single
facade, so the backend can later run as its own service unchanged.

## The frugality engine

The core IP lives in `apps/backend/src/engine`. It is pure (no I/O) and fully
unit-tested:

1. **Landed cost** — normalises every offer to the true cost at your door. Indian
   listed prices are GST-inclusive, so it adds only estimated shipping (free over
   ₹500) for whatever a store omits, making comparisons fair.
2. **Ranking** — eligible offers (in stock, allowed store, right condition) ranked
   by landed cost, tie-broken by delivery speed, rating, then store trust.
3. **Proposal** — decides whether today's best price is worth acting on:
   _under budget_ · _unusual dip vs. the day's median_ · _deadline near_.

We **never buy autonomously**: the engine proposes, you approve.

## Quick start

```bash
nvm use                 # Node 20.11+ (see .nvmrc)
npm install             # installs all workspaces
cp .env.example .env    # optional — every value has a working default
npm run seed            # create a demo user + 2 wishes + an initial price search
npm run dev             # middleware (:4000) + frontend (:5173) together
```

Open http://localhost:5173 and sign in as **demo@patiently.app** (pre-filled).

### Useful scripts

| Command                           | What it does                                       |
| --------------------------------- | -------------------------------------------------- |
| `npm run dev`                     | Run middleware + frontend together                 |
| `npm run seed`                    | Seed demo data and run one search pass             |
| `npm run job:daily-search`        | Run the daily-search worker once (what cron calls) |
| `npm test`                        | Run unit tests (frugality engine, shared)          |
| `npm run typecheck`               | Type-check every workspace                         |
| `npm run lint` / `npm run format` | Lint / format the monorepo                         |

## Going live (real prices)

Add either of these to `.env` and that store flips from mock to live
automatically — no code change (see
[`apps/backend/src/adapters`](./apps/backend/src/adapters)):

- **Amazon.in PA-API v5** — `AMAZON_ACCESS_KEY`, `AMAZON_SECRET_KEY`,
  `AMAZON_PARTNER_TAG` (host/region/marketplace already default to `.in`)
- **Flipkart Affiliate API** — `FLIPKART_AFFILIATE_ID`, `FLIPKART_AFFILIATE_TOKEN`

Croma, Reliance Digital, Tata CLiQ and Myntra use the mock feed until a live
adapter is added — each is a clean template (`StoreAdapter`) for the next
integration. On boot the backend logs which stores are `LIVE` vs `mock`.

## Production notes

This is an MVP. Before real money moves, see the "Productionisation" section of
[ARCHITECTURE.md](./ARCHITECTURE.md) — notably real checkout + India payments
(**UPI / cards / netbanking via Razorpay/PayU/Cashfree**, with saved payment
methods and per-wish spend caps), swapping the JSON-file store for Postgres, and
scaling the search worker. WhatsApp/SMS are the natural notification channels in
India (see [MOBILE.md](./MOBILE.md)).
