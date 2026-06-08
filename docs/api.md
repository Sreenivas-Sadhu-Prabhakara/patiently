# API reference

Clients talk only to the **middleware** (default `http://localhost:4000`). All
payloads are JSON; money is always **integer paise**. Authenticated routes need a
bearer token from `/api/auth/login`.

!!! info "Auth"
    `POST /api/auth/login` returns a JWT. Send it as `Authorization: Bearer <token>`
    on every authenticated request. The MVP login is passwordless (email only) —
    swap for OTP / OAuth / passkeys in production.

## Auth

### `POST /api/auth/login`

```json title="Request"
{ "email": "demo@patiently.app", "name": "Demo User" }
```

```json title="Response"
{ "token": "eyJ…", "user": { "id": "…", "email": "demo@patiently.app", "name": "Demo User" } }
```

### `GET /api/auth/me`

Returns the current user. Requires auth.

## Wishes

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/wishes` | List your wishes, each enriched with best offer + savings. |
| `POST` | `/api/wishes` | Create a wish. |
| `GET` | `/api/wishes/:id` | One wish, enriched. |
| `PATCH` | `/api/wishes/:id` | Update a wish. |
| `DELETE` | `/api/wishes/:id` | Cancel a wish. |
| `POST` | `/api/wishes/:id/search` | Run the daily search now for this wish. |
| `POST` | `/api/wishes/:id/decision` | Approve or reject a pending proposal. |

```json title="POST /api/wishes — create"
{
  "title": "Sony WH-1000XM5 wireless headphones",
  "brand": "Sony",
  "desiredByDate": "2026-11-01T00:00:00.000Z",
  "maxBudgetCents": 2699000,
  "condition": "new",
  "allowedStores": ["amazon_in", "flipkart"]
}
```

```json title="POST /api/wishes/:id/decision — approve"
{ "approve": true }
```

A wish moves `active → awaiting_approval → purchasing → purchased` (or back to
`active` if you decline / checkout fails, or `expired` past its horizon).

## Notifications

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/notifications?unread=1` | List your notifications. |
| `POST` | `/api/notifications/:id/read` | Mark one read. |

## Devices (push)

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/devices` | Register this device's push token. |
| `DELETE` | `/api/devices/:token` | Unregister a token. |

```json title="POST /api/devices"
{ "token": "fcm-device-token…", "platform": "android" }
```

## Jobs

### `POST /api/jobs/daily-search`

Runs the daily-search worker over **all** active wishes. Protected by a shared
token (for an external cron), not a user JWT:

```bash
curl -X POST http://localhost:4000/api/jobs/daily-search \
  -H "x-job-token: $JOB_TRIGGER_TOKEN"
```

```json title="Response"
{ "wishesSearched": 3, "offersCaptured": 21, "proposalsRaised": 1 }
```

## Errors

Consistent JSON shape with appropriate HTTP status codes:

```json
{ "error": "ValidationError", "details": { "…": "…" } }
```

- `400` validation error · `401` unauthorised · `404` not found ·
  `409` no pending decision · `500` internal.
