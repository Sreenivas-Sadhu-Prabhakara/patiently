# Mobile plan

Patiently is a mobile product. The web client is the first surface; a native app
is the next, and the architecture is built for it from day one.

## Why mobile fits this product

The product's defining moment — _"a great price just appeared; approve to buy?"_ —
is a **push notification**. That moment lives or dies on mobile. The daily-search
worker already creates `Notification` records (`approval_needed`, `deal_found`,
`purchased`); those are exactly what a push pipeline sends.

## What's already mobile-ready

- **Shared contract.** `@patiently/shared` is platform-agnostic — React Native
  imports the same types and Zod schemas.
- **One API surface.** Everything goes through the middleware over plain JSON.
  There is no web-only coupling.
- **Reusable client.** `apps/frontend/src/api/client.ts` (the typed `ApiClient`)
  works unchanged in React Native — only the token store differs (`localStorage`
  → `expo-secure-store` / `AsyncStorage`). Factor that one line behind an
  interface and the file is shared as-is.
- **Mobile-first UI.** The web app is a single-column, phone-width, card-based
  layout with safe-area insets — the interaction model ports directly.

## Proposed approach

- **React Native + Expo, TypeScript.** Fastest path to iOS + Android from one
  codebase; Expo handles push, secure storage, and OTA updates.
- **Add `apps/mobile`** as a fourth workspace consuming `@patiently/shared` and
  the shared `ApiClient`. No backend/middleware changes required.
- **Push + WhatsApp/SMS (India).** Add a `PushSender` in the backend's
  `NotificationService` seam (Expo Push / FCM / APNs). Store device tokens per
  user; send a push whenever an `approval_needed` notification is created, and
  deep-link straight to the wish's Approve & buy screen. In India, also wire a
  **WhatsApp Business API** template (and SMS fallback) — for many users WhatsApp
  is the primary channel, and an "approve to buy" template message converts the
  moment even when the app isn't open.
- **Biometric + UPI approval.** Gate "Approve & buy" behind Face ID / fingerprint,
  then complete payment via **UPI** (intent/collect) or a tokenised card through
  Razorpay/PayU — the natural, India-native trust step before money moves.
- **Background refresh.** The daily search runs server-side (cron → job endpoint),
  so the app needs no background work; it just renders fresh state and reacts to
  pushes.

## Rollout

1. Web MVP (this repo) — validate the loop and the frugality engine. ✅
2. Extract `ApiClient` token storage behind an interface (web + native impls).
3. `apps/mobile` (Expo) reusing shared types + client; ship the wish list,
   create-wish, and approve-to-buy screens.
4. Push pipeline + device-token registration endpoint in the middleware.
5. Biometric approval, deep links, app-store release.
