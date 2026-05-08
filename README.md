# CoffeePreorderQR ☕📱

Pre-order coffee, pick a locker, scan a QR. Three pieces:

- **mobile/** — Customer app (React Native + Expo), dark "Brew" theme.
- **server/** — Node + Express + Prisma + PostgreSQL backend.
- **dashboard/** — Web dashboard for the barista (Vite + React).

A customer signs up, picks a drink, customizes it, picks a locker, pays
(mock), and receives a unique QR code. The barista sees the order on the
**dashboard** the moment it's placed, marks it `Preparing`, then `Ready`
when they drop the cup in the locker — and the customer's phone updates
live with a "Ready for pickup!" state and the locker info. The customer
walks up, the locker scanner reads the QR on their phone, and the door
opens.

## Repo layout

```
CoffeePreorderQR/
├── mobile/      # Customer phone app (React Native / Expo)
├── server/      # Express + Prisma + PostgreSQL API
├── dashboard/   # Barista web dashboard (Vite + React, SSE-fed)
└── README.md
```

Each file under `mobile/src/components/`, `mobile/src/screens/`,
`dashboard/src/components/`, and `dashboard/src/pages/` is one component or
one screen. No monolith files.

## Quick start

### 1. Backend

```bash
cd server
cp .env.example .env          # edit DATABASE_URL + JWT_SECRET
npm install
npx prisma migrate dev        # applies init + product_emoji_category migrations
npm run seed                  # menu, lockers, and the barista@coffee.app staff account
npm run dev                   # http://localhost:4000
```

You need a running PostgreSQL instance. Default `.env` assumes:
`postgresql://postgres:postgres@localhost:5432/coffeepreorder`.

### 2. Customer mobile app

```bash
cd mobile
cp .env.example .env          # set EXPO_PUBLIC_API_URL to your machine's LAN IP
npm install
npx expo start
```

Scan the QR with Expo Go (iOS / Android) or press `i` / `a` for simulators.

> If you're running the API on `localhost:4000` and testing on a physical
> phone, set `EXPO_PUBLIC_API_URL=http://<your-laptop-LAN-ip>:4000` so the
> phone can actually reach it.

### 3. Barista dashboard

```bash
cd dashboard
cp .env.example .env          # VITE_API_URL=http://localhost:4000
npm install
npm run dev                   # http://localhost:5173
```

Sign in with the seeded staff account: **`barista@coffee.app` / `barista1234`**.

## End-to-end flow

```
[Customer phone]                [Server]                       [Barista dashboard]
─────────────────               ────────                       ───────────────────
Sign up / sign in   ──────────► POST /api/auth/*
Browse menu         ──────────► GET  /api/menu
Pick drink + size + locker
Pay                 ──────────► POST /api/orders ──┐
                                                   │ publishOrderEvent('order.created')
                                                   │
QR shown on phone ◄── qrToken returned             │
Polls /api/orders/:id every 3s                     │
                                                   ▼
                                          SSE /api/orders/stream  ──► new card on dashboard
                                                                       (column: New)

                                          PATCH /api/orders/:id/status
                                          { status: PREPARING } ◄────── click "Start Preparing"
                                                   │
                                                   ▼ publishOrderEvent('order.updated')
                                                                       card moves to "Preparing"
Phone re-poll → status updates ◄──────────────────────────────────────  (also broadcast on
                                                                        order:<id> channel)

                                          PATCH /api/orders/:id/status
                                          { status: READY } ◄────────── click "Mark Ready"
                                                   │
                                                   ▼
Phone flips to "Ready for pickup!" with locker info

Locker hardware POSTs scanned token to /api/pickup/scan → order PICKED_UP, door opens.
```

## API surface (added since v1)

| Method | Path                       | Auth   | Purpose                                |
|-------:|----------------------------|--------|----------------------------------------|
|  GET   | `/api/orders/active`       | staff  | All active orders (PAID / PREPARING / READY) |
|  GET   | `/api/orders/stream`       | staff  | Server-Sent Events: every order create / update |
|  GET   | `/api/orders/:id/stream`   | owner/staff | Server-Sent Events: one order's live state |

Existing endpoints (signup / signin / menu / lockers / orders / pickup) are
unchanged in behaviour, only enriched: `/api/orders` now accepts the new
`mock_credits` payment method, and Product responses include `emoji` +
`category` so the new menu UI can render tiles.

## Realtime notes

The server has a tiny in-process event bus (`server/src/utils/eventBus.js`).
Whenever an order is created or its status changes, two events are published:

- `staff` channel — every dashboard's SSE feed picks this up.
- `order:${id}` channel — the customer SSE listens here for their own order.

The customer mobile app uses a 3s polling hook instead of SSE because React
Native doesn't ship an `EventSource` and adding a native SSE library felt
heavier than the win. The dashboard runs in a browser, so it uses real SSE.
This is single-process; if you ever scale the API behind a load balancer,
swap the EventEmitter for Redis pub/sub.

## Database

PostgreSQL via Prisma. `server/prisma/schema.prisma` defines:

- `User` — accounts (email + bcrypt password hash) with `role: CUSTOMER | STAFF`.
- `Product` — coffee drinks. Now also has `emoji` and `category`.
- `Locker` — physical lockers with a number, location, and status.
- `Order` + `OrderItem` — what was bought, by whom, for which locker.
- `QrCode` — sha-256 hash of the unique pickup token, 1:1 with an order.

QR tokens are stored hashed — the raw token only exists on the customer's
phone, the same posture as a session token. See "Security notes" in
`server/README.md`.
