# Patiently — Flutter mobile client

The native mobile client (Android + iOS) for **Patiently**. It talks only to the
middleware API — the same contract the web client uses — and is built India-first
(₹, GST-inclusive landed cost, Amazon.in / Flipkart / Croma / Reliance Digital /
Tata CLiQ / Myntra).

## Prerequisites

- Flutter 3.x (`flutter --version`)
- The Patiently backend running — from the repo root:
  ```bash
  npm install && npm run seed && npm run dev   # middleware on :4000
  ```

## Run

```bash
cd mobile
flutter pub get

# iOS simulator / web / desktop (host is reachable as localhost):
flutter run --dart-define=API_BASE_URL=http://localhost:4000

# Android emulator (the host machine is 10.0.2.2, not localhost):
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000
```

Sign in as **demo@patiently.app** (pre-filled). You'll see the seeded wishes; the
Samsung TV will be **ready to buy** — tap **Approve & buy** (a biometric prompt
appears on a configured device) to complete the simulated purchase.

> The API base URL is a compile-time `--dart-define`, so one build can target
> local / staging / prod. Default is `http://localhost:4000`.

## Verify

```bash
flutter analyze        # static analysis (lints)
flutter test           # unit tests (money formatting, JSON model parsing)
flutter build web      # compiles the full app to a real artifact
```

## Project layout

```
lib/
├── main.dart                     app entry
├── app.dart                      providers + MaterialApp + auth gate
├── core/                         config · theme · ₹ money/horizon · biometric gate
├── data/                         enums · models · ApiClient · secure token store
├── state/                        AuthController · WishesController (ChangeNotifier)
└── features/
    ├── auth/login_screen.dart
    └── wishes/                   wishes_screen · wish_card · wish_form_screen
test/                             money_test · models_test
```

State management is `provider` + `ChangeNotifier`. The Dart models in `data/`
mirror the server's `@patiently/shared` Zod schemas (see [../MOBILE.md](../MOBILE.md)
for the plan to codegen them and add push / UPI / WhatsApp).

## Biometric approval

"Approve & buy" is gated behind `local_auth`. It **degrades gracefully** — if no
biometrics are enrolled or the platform isn't configured, it proceeds rather than
locking you out. For the prompt to actually appear in production, add the platform
config: iOS `NSFaceIDUsageDescription` in `Info.plist`; Android `USE_BIOMETRIC`
permission and a `FlutterFragmentActivity` host.
