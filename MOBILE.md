# Mobile

Patiently is a mobile-first product. The web client is one surface; the **Flutter
app in [`mobile/`](./mobile) is the real mobile client** (Android + iOS from one
codebase), built and verified (`flutter analyze` clean, `flutter test` green, web
build succeeds).

## Why mobile fits this product

The product's defining moment — _"a great price just appeared; approve to buy?"_ —
is a **push notification**. That moment lives or dies on mobile. The daily-search
worker already creates `Notification` records (`approval_needed`, `deal_found`,
`purchased`); those are exactly what a push pipeline sends.

## What the Flutter client reuses

- **One API surface.** Everything goes through the middleware over plain JSON —
  no web-only coupling. The Dart `ApiClient` (`mobile/lib/data/api_client.dart`)
  mirrors the web client against the same contract.
- **Shared contract, mirrored in Dart.** `mobile/lib/data/{enums,models}.dart`
  mirror `@patiently/shared`; money stays integer paise and is formatted ₹ (en-IN)
  with `intl`, identical to the web. (A future step could codegen these Dart
  models from the Zod schemas to keep them in lock-step automatically.)
- **Same interaction model.** Phone-width, card-based wish list → best landed
  price → one-tap **Approve & buy**, matching the web UX and brand theme.

## What's implemented in `mobile/`

- Passwordless sign-in (secure-storage JWT via `flutter_secure_storage`).
- Wish list with best landed price, GST-inclusive breakdown, savings, status, and
  pull-to-refresh.
- Create-wish flow (item, brand, ₹ budget, 3–6 month horizon, condition, stores).
- Approve / reject a proposal and "check price now" — wired to the live API.
- **Biometric-gated approval** (`local_auth`) before the money-moving action,
  degrading gracefully where biometrics aren't configured.
- **Push notifications (FCM), end-to-end.** The backend has a `PushSender` seam
  (`apps/backend/src/push`): an `approval_needed` notification fans out to the
  user's registered devices — a real `FcmPushSender` (HTTP v1, service-account
  RS256 auth) when `FIREBASE_*` creds are set, else a log sender. The app
  registers its FCM token on launch via `POST /api/devices`
  (`mobile/lib/core/push_service.dart`), guarded so it no-ops when Firebase isn't
  configured for the build. To activate on device: run `flutterfire configure`
  (adds google-services.json / GoogleService-Info.plist) and set the backend
  `FIREBASE_*` service-account env vars.

## Next steps to production

- **WhatsApp/SMS (India).** Alongside FCM, wire a **WhatsApp Business API**
  template (+ SMS fallback) into the same `PushSender` seam — for many Indian
  users WhatsApp is the primary channel and converts the approve-to-buy moment
  even when the app is closed.
- **UPI checkout.** Complete the approved purchase via **UPI** (intent/collect) or
  a tokenised card through Razorpay/PayU — replacing the mock checkout provider.
- **Biometric platform config.** iOS `NSFaceIDUsageDescription`; Android
  `USE_BIOMETRIC` permission + a `FlutterFragmentActivity` host, so the prompt
  actually appears (the gate already degrades safely without it).
- **Model codegen + CI.** Generate Dart models from the shared Zod schemas; add a
  `flutter analyze && flutter test` job to CI.
- **Background refresh is server-side** — the daily search runs via cron → job
  endpoint, so the app just renders fresh state and reacts to pushes.

See [`mobile/README.md`](./mobile/README.md) to run it.
