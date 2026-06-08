# Get started

Patiently runs end-to-end **today** with zero API keys — it uses seeded, ₹-priced
mock feeds so you can see the whole product (web + mobile) working in a few
minutes, then flip individual stores to live data later.

## Prerequisites

- **Node.js 20.11+** (`nvm use` honours `.nvmrc`)
- **Flutter 3.x** — only if you want to run the mobile app

## Run the backend + web app

```bash
npm install            # installs all workspaces
cp .env.example .env   # optional — every value has a working default
npm run seed           # demo user + 2 ₹ wishes + an initial price search
npm run dev            # middleware on :4000 + web app on :5173
```

Open **<http://localhost:5173>** and sign in as `demo@patiently.app` (pre-filled).
You'll see the seeded wishes; one will be **ready to buy** — approve it to complete
a simulated purchase.

!!! note "What the seed creates"
    A demo user, a *Sony WH-1000XM5* wish (₹26,990 budget) and a *Samsung 55″ 4K
    TV* wish (₹90,000), plus one search pass so there are already prices to look at.

## Run the mobile app (Flutter)

```bash
cd mobile
flutter pub get

# iOS simulator / web / desktop (host is reachable as localhost):
flutter run --dart-define=API_BASE_URL=http://localhost:4000

# Android emulator (the host machine is 10.0.2.2, not localhost):
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000
```

Same demo login. Tapping **Approve & buy** triggers a biometric prompt on a
configured device. See the [mobile guide](mobile.md) for details.

## Handy commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Run middleware + web app together |
| `npm run seed` | Seed demo data and run one search pass |
| `npm run codegen` | Regenerate the Flutter Dart models from the Zod schemas |
| `npm run job:daily-search` | Run the daily-search worker once (what cron calls) |
| `npm test` | Unit tests (frugality engine, money, push fan-out) |
| `npm run typecheck` / `npm run lint` | Type-check / lint the monorepo |

## Go live with real prices

Add any of these to `.env` and that store flips from mock to live automatically —
no code change:

- **Amazon.in PA-API v5** — `AMAZON_ACCESS_KEY`, `AMAZON_SECRET_KEY`, `AMAZON_PARTNER_TAG`
- **Flipkart Affiliate API** — `FLIPKART_AFFILIATE_ID`, `FLIPKART_AFFILIATE_TOKEN`

On boot, the backend logs which stores are `LIVE` vs `mock`. Croma, Reliance
Digital, Tata CLiQ and Myntra use the mock feed until a live adapter is added.

## Turn on push notifications

1. Set the backend's `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` and
   `FIREBASE_PRIVATE_KEY` (from a Firebase service-account JSON).
2. In `mobile/`, run `flutterfire configure` to add your Firebase project.

Until then, the backend uses a log-only push sender (the approve-to-buy flow still
works — pushes are just logged), and the app skips push gracefully.

[How it works →](how-it-works.md){ .md-button }
[API reference →](api.md){ .md-button }
