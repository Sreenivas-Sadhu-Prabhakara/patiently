# FAQ

Everything people ask before they trust an app to shop for them.

??? question "Does Patiently buy things without asking me?"
    **No — never.** Patiently is human-in-the-loop by design. It *proposes* a
    purchase when the price is right; **you** approve it with one tap (gated by
    Face ID / fingerprint on mobile). Nothing is bought without your explicit go.

??? question "How does it actually buy the item?"
    In this MVP, checkout is **simulated** so you can see the full flow safely.
    The real path is a `CheckoutProvider` seam designed for India: UPI / cards /
    netbanking via Razorpay, PayU or Cashfree, with tokenised payment methods and
    per-wish spend caps. See the [architecture](architecture.md).

??? question "Which stores do you compare?"
    Amazon.in, Flipkart, Croma, Reliance Digital, Tata CLiQ and Myntra. Amazon.in
    and Flipkart use official APIs; the rest are pluggable adapters. Every offer is
    ranked by **true landed cost** — price + shipping + GST − discounts.

??? question "What's “landed cost” and why does it matter?"
    It's what actually leaves your account: the item price **plus shipping, plus
    tax, minus discounts**. The cheapest sticker price often isn't the cheapest
    purchase once delivery is added — Patiently always compares the honest number.

??? question "What if the price never drops to my budget?"
    You set a horizon (3–6 months). As the deadline nears, Patiently proposes the
    **best available price** so you don't miss the window — and tells you if it's
    above budget, so the call is still yours. Or you just let the wish expire.

??? question "Why is patience an advantage in India specifically?"
    India's discount calendar is huge and predictable — Big Billion Days, the
    Great Indian Festival, Republic Day, end-of-season sales. Declaring a wish in
    August and letting Patiently wait for the October low routinely beats paying
    today's price.

??? question "Is my data and payment information safe?"
    The session token is stored in platform-secure storage on mobile. Payment
    happens through PCI-compliant providers (Razorpay/PayU) with tokenised methods
    — Patiently doesn't store raw card details. You approve every purchase.

??? question "What does it cost?"
    This repository is the open product MVP — free to run locally. A hosted
    product would typically monetise via affiliate revenue from the stores and/or
    a thin subscription; either way the incentive is aligned: **find you the
    lowest price.**

??? question "Can I use it on my phone?"
    Yes — there's a native **Flutter app** for Android and iOS that reuses the same
    API, with push notifications for the approve-to-buy moment. See the
    [mobile guide](mobile.md).

??? question "Is this a real product or a demo?"
    It's a working, end-to-end MVP: real frugality engine, real store-adapter
    architecture (live with API keys), real mobile app, tests and CI. The pieces
    gated behind real money — automated checkout and live payments — are clearly
    marked and scoped for production.

---

<div class="cta-band" markdown>

## Ready to buy on purpose?

[Get started](getting-started.md){ .md-button .md-button--primary }
[How it works](how-it-works.md){ .md-button }

</div>
