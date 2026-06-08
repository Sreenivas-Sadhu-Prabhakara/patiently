# Mobile app

Patiently is mobile-first. The native client is a **Flutter** app (Android + iOS)
in `mobile/`, talking to the same middleware API as the web app — because the
defining moment of the product, *"a great price appeared — approve to buy?"*, is a
**push notification**.

## What's in the app

- **Passwordless sign-in**, with the JWT held in platform-secure storage.
- **Wish list** — best landed price (₹), GST-inclusive breakdown, savings vs.
  typical, status, and pull-to-refresh.
- **Create a wish** — item, brand, ₹ budget, 3–6 month horizon, condition, and
  which stores to allow.
- **Approve / reject** a proposal and **check price now**, wired to the live API.
- **Biometric-gated "Approve & buy"** (Face ID / fingerprint) before any money
  moves — degrading gracefully where biometrics aren't configured.
- **Push registration** — the FCM token is registered with the backend on launch.

## Run it

```bash
cd mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://localhost:4000   # iOS sim / web / desktop
# Android emulator → http://10.0.2.2:4000
```

```bash
flutter analyze    # static analysis (clean)
flutter test       # unit tests (money formatting, model JSON)
flutter build web  # compiles the full app to a real artifact
```

## Models are generated, not hand-written

The Dart model layer (`mobile/lib/data/api.g.dart`) is **generated from the Zod
schemas** in `@patiently/shared`:

```bash
npm run codegen    # from the repo root → regenerates api.g.dart
```

So the mobile contract can never silently drift from the server. Human-only
concerns the schemas can't express — friendly store/condition labels — live as
hand-written Dart extensions in `enums.dart`.

## Push notifications

The backend already fans every `approval_needed` notification out to a user's
registered devices (see the [architecture](architecture.md)). To light it up on a
real device:

1. **Backend:** set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`,
   `FIREBASE_PRIVATE_KEY` (from a Firebase service-account JSON). With these, the
   backend uses the real FCM HTTP v1 sender; without them, a log-only sender.
2. **App:** run `flutterfire configure` to add your Firebase project
   (google-services.json / GoogleService-Info.plist).
3. **Biometric platform config** (for the prompt to appear): iOS
   `NSFaceIDUsageDescription`; Android `USE_BIOMETRIC` + a `FlutterFragmentActivity`
   host.

The app is built to **degrade gracefully**: with no Firebase config it simply
skips push, and with no enrolled biometrics it proceeds rather than locking you
out — so it always runs.

## On the roadmap

- **WhatsApp / SMS** notifications alongside FCM (India's primary channels).
- **UPI checkout** (intent / collect) or tokenised cards via Razorpay/PayU.
- **Deep links** from a push straight to the wish's Approve & buy screen.
