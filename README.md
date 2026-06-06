# CoffeePreorderQR ☕📱🔓

Pre-order coffee from your phone, pay, and pick it up from a **smart locker
cabinet** — no waiting in line. A barista manages orders live from a web
dashboard, and a Raspberry Pi physically unlocks the right compartment when
the customer is ready.

Four pieces:

- **mobile/** — Customer app (React Native + Expo, dark "Brew" theme)
- **server/** — Node + Express + Prisma + PostgreSQL backend
- **dashboard/** — Barista web dashboard (Vite + React, SSE-fed)
- **pi/** — Raspberry Pi 5 locker controller (Python, 4 solenoids + camera)

## How it works

A customer signs up, fills a **cart** with one or more drinks (each
customized: size / milk / extras / quantity), pays (mock), and gets a unique
**QR code** plus an **auto-assigned door number** (1–4). The barista sees the
order on the **dashboard** the instant it's placed, marks it `Preparing`, then
`Ready` once the cup is in the compartment — and the customer's phone updates
live (poll + **push notification**) to "Ready for pickup!".

To collect, the customer either taps **"Open Door N"** in the app or shows the
QR to the cabinet's **camera scanner**. Either way the backend flags the
compartment, the **Raspberry Pi** (polling the backend) pulses that solenoid,
and the door pops open.

Every order also earns **loyalty points** with tiers (Bronze → Platinum) that
unlock automatic discounts and faster earning.

## Repo layout

```
CoffeePreorderQR/
├── mobile/      # Customer phone app (React Native / Expo)
├── server/      # Express + Prisma + PostgreSQL API
├── dashboard/   # Barista web dashboard (Vite + React, SSE-fed)
├── pi/          # Raspberry Pi locker controller (Python)
└── README.md
```

Each file under `mobile/src/components/`, `mobile/src/screens/`,
`dashboard/src/components/`, and `dashboard/src/pages/` is one component or
one screen. No monolith files.

## Features

**Customer app (mobile/)**
- Email/password auth (JWT). Google sign-in wired (needs a dev build).
- Menu with real product photos + category filter; live weather greeting.
- Shopping cart — multiple different drinks in one order.
- Per-item customization: size (S/M/L), milk, extras, quantity.
- Auto-assigned pickup door (server picks first free compartment 1–4).
- Live order tracking (3s poll) + push notifications on status changes.
- "Open Door N" button and on-screen QR for pickup.
- Loyalty: points balance, tier, progress, redeem at checkout.
- 4 clean tabs: Menu · Cart · Rewards · Profile (orders live in Profile).

**Barista dashboard (dashboard/)**
- Staff login (STAFF role only).
- Live 4-column board (New → Preparing → Ready → Picked Up) via SSE.
- One-click status changes; each card shows the door number to fill.
- Delete one / clear all picked-up orders.

**Backend (server/)**
- REST API + two SSE feeds (staff firehose + per-order channel).
- Auto-assign compartment, QR mint (hashed), loyalty math, push fan-out.
- `locker-hub` poll/ack endpoints for the Pi (shared-secret auth).

**Raspberry Pi (pi/)**
- One cabinet, 4 compartments → 4 relays/solenoids on GPIO 17/27/22/23.
- `locker_hub.py` — owns the relays, polls the backend, opens doors, plus a
  Flask web UI with manual unlock buttons.
- `scanner.py` — Camera Module 3 (Picamera2 + autofocus) reads the QR and
  tells the backend to open.
- `locker_mock.py` — run the hub on a PC/Mac without GPIO for testing.

## Quick start (local dev)

### 1. Backend

```bash
cd server
cp .env.example .env          # set DATABASE_URL, JWT_SECRET, LOCKER_HUB_KEY
npm install
npx prisma migrate deploy     # apply all migrations
npm run seed                  # menu (+ photos), 4 compartments, barista account
npm run dev                   # http://localhost:4000
```

Needs PostgreSQL. Default `.env` assumes
`postgresql://postgres:postgres@localhost:5432/coffeepreorder`.
(Production uses **Neon** for the DB and **Render** for the API — see Deploy.)

### 2. Customer mobile app

```bash
cd mobile
cp .env.example .env          # EXPO_PUBLIC_API_URL = your API URL
npm install
npx expo start
```

Open in Expo Go (iOS / Android) or a simulator. For a physical phone hitting a
local API, set `EXPO_PUBLIC_API_URL=http://<your-laptop-LAN-ip>:4000`.

> Push notifications and Google sign-in don't work in Expo Go (Expo removed
> them in SDK 53) — build a real APK to test those (see "Build an APK").

### 3. Barista dashboard

```bash
cd dashboard
cp .env.example .env          # VITE_API_URL=http://localhost:4000
npm install
npm run dev                   # http://localhost:5173
```

Seeded staff account: **`barista@coffee.app` / `barista1234`**.

### 4. Raspberry Pi locker (optional hardware)

```bash
# on the Pi
cd ~/CoffeePreorderQR && git pull
cd pi
sudo apt install -y python3-picamera2 libzbar0
python3 -m venv --system-site-packages .venv
source .venv/bin/activate
pip install pyzbar requests python-dotenv
cp .env.example .env          # set API_URL + LOCKER_HUB_KEY (same as server)

python locker_hub.py          # terminal 1: relays + door opening + web UI
python scanner.py             # terminal 2: QR camera scanner
```

See `pi/README.md` for the wiring diagram (relay module + 12V solenoids).

## End-to-end flow

```
[Customer phone]            [Server (Render)]          [Dashboard]        [Raspberry Pi]
────────────────           ──────────────────         ───────────        ──────────────
Sign in / sign up ───────► POST /api/auth/*
Browse menu       ───────► GET  /api/menu
Add drinks to cart
Checkout (cart) ─────────► POST /api/orders ──┐ auto-assign door 1–4
  (tier discount +         publishOrderEvent  │ award loyalty points
   optional points)                           ▼
QR + door # shown ◄── qrToken         SSE /api/orders/stream ─► "Place in door #N"
Polls /api/orders/:id (3s)

                           PATCH /:id/status PREPARING ◄── "Start Preparing"
Push: "being made" ◄────── notifyOrderStatus()              card → Preparing

                           PATCH /:id/status READY ◄─────── "Mark Ready"
Push: "Ready! door #N" ◄──                                  card → Ready

— Pickup, two ways —
(a) tap "Open Door N" ───► POST /api/orders/:id/open ─┐ unlockPending=true
(b) show QR to camera ◄── scanner POSTs /api/pickup/scan
                                                      ▼
                           GET /api/locker-hub/pending ◄──── Pi polls every 2s
                           → { compartments:[N] }    ──────► pulse GPIO → solenoid
                           POST /api/locker-hub/ack  ◄────── Pi clears the flag
Push: "enjoy" ◄─────────── order PICKED_UP                  dashboard → Picked Up
```

**Why the Pi polls:** it sits behind a home router (NAT); Render can't reach
into the LAN, so the Pi reaches out instead. 2s latency is fine for a door.

## API surface

| Method | Path | Auth | Purpose |
|-------:|------|------|---------|
| POST | `/api/auth/signup` `/signin` | — | register / login (JWT) |
| GET | `/api/auth/me` | user | profile + loyalty summary |
| GET | `/api/auth/loyalty` | user | points / tier / progress |
| POST | `/api/auth/push-token` | user | register Expo push token |
| GET | `/api/menu` | user | products (with photos, emoji, category) |
| GET | `/api/lockers` | user | compartments + status |
| POST | `/api/orders` | user | create order (cart, auto-door, loyalty) |
| GET | `/api/orders` | user | own order history |
| GET | `/api/orders/:id` | owner/staff | one order |
| GET | `/api/orders/:id/stream` | owner/staff | SSE: one order's live state |
| POST | `/api/orders/:id/open` | owner/staff | open the door (button path) |
| GET | `/api/orders/active` | staff | orders on the bar |
| GET | `/api/orders/picked-up` | staff | completed orders |
| GET | `/api/orders/stream` | staff | SSE: all order events |
| PATCH | `/api/orders/:id/status` | staff | PAID→PREPARING→READY / CANCELLED |
| DELETE | `/api/orders/:id` · `/picked-up` | staff | delete finalized order(s) |
| POST | `/api/pickup/scan` | — | QR scan path (hardware) |
| GET | `/api/locker-hub/pending` · POST `/ack` | hub key | Pi poll/ack |

## Loyalty system

`server/src/utils/loyalty.js` is the single source of truth (mirrored in
`mobile/src/utils/loyalty.js` for previews).

- Earn **1 point per €0.10** spent, × the tier multiplier.
- **100 points = €1 off**, redeemable at checkout.
- Tiers by lifetime points: 🥉 Bronze (0) · 🥈 Silver (500, 5% off, 1.2×) ·
  🥇 Gold (1500, 10%, 1.5×) · 💎 Platinum (4000, 15%, 2×).
- Tier discount auto-applies; cancellations reverse points.

## Realtime

Tiny in-process event bus (`server/src/utils/eventBus.js`). On every order
create / status change it publishes on a `staff` channel (dashboard SSE) and an
`order:${id}` channel (per-customer SSE). The mobile app uses a 3s poll instead
of SSE (React Native has no `EventSource`) plus push notifications. Single
process — swap the EventEmitter for Redis pub/sub to scale horizontally.

## Database

PostgreSQL via Prisma (`server/prisma/schema.prisma`):

- `User` — email + bcrypt hash, `role: CUSTOMER | STAFF`, loyalty
  (`points`, `lifetimePoints`), `googleId`, `pushToken`.
- `Product` — drinks with `priceCents`, `imageUrl`, `emoji`, `category`.
- `Locker` — a compartment: `number` (→ GPIO pin), `status`, `unlockPending`.
- `Order` + `OrderItem` — what was bought, by whom, which door; loyalty
  bookkeeping (`pointsEarned`, `pointsRedeemed`).
- `QrCode` — SHA-256 of the pickup token (raw token only lives on the phone).

## Deploy

- **Database**: Neon (free Postgres). Paste its URL into `DATABASE_URL`.
- **API**: Render (free web service). Auto-deploys from GitHub; set
  `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `LOCKER_HUB_KEY`. Build runs
  `prisma generate && prisma migrate deploy`.
- **Clients**: point `EXPO_PUBLIC_API_URL` (mobile) and `VITE_API_URL`
  (dashboard) at the Render URL.

### Build an APK (real device, push + Google sign-in work)

```bash
cd mobile
npx eas-cli build --profile preview --platform android
```

EAS builds in the cloud and returns an APK download link.

## Tech stack

React Native · Expo SDK 56 · React Navigation · expo-secure-store ·
expo-notifications · Node.js · Express · Prisma · PostgreSQL (Neon) · JWT ·
bcrypt · Zod · Server-Sent Events · Vite · React · Python · Picamera2 ·
gpiozero · Flask · Render · EAS.

## Notes & limitations (prototype)

- Payment is **mocked** — swap in Stripe for real charges.
- Single Pi / single cabinet; multi-location would need per-locker hub keys.
- Render free tier cold-starts after ~15 min idle (first request is slow).
- Push & Google sign-in require a dev/standalone build, not Expo Go.
