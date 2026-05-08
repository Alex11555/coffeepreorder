# Brew · Barista Dashboard

A web dashboard for the people behind the bar. Logs in with a STAFF account,
shows every active order live (via Server-Sent Events from `/api/orders/stream`),
and exposes one-click status changes:

`PAID → PREPARING → READY`

When you hit **Mark Ready**, the customer's phone (which polls
`/api/orders/:id` every few seconds) flips to "Ready for pickup!" with the
locker location and live QR.

## Setup

```bash
cd dashboard
cp .env.example .env          # edit VITE_API_URL if your API isn't on localhost:4000
npm install
npm run dev                   # http://localhost:5173
```

Default seeded staff account: `barista@coffee.app` / `barista1234`.

## Project layout

```
dashboard/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx               # React entry
    ├── App.jsx                # routes
    ├── api/
    │   ├── client.js          # fetch wrapper + base URL
    │   ├── auth.js
    │   └── orders.js          # incl. SSE URL helper
    ├── context/
    │   └── AuthContext.jsx    # JWT + staff guard
    ├── hooks/
    │   └── useLiveOrders.js   # SSE-fed orders state
    ├── components/
    │   ├── Topbar.jsx
    │   ├── StatusBadge.jsx
    │   ├── OrderCard.jsx
    │   └── OrdersColumn.jsx
    ├── pages/
    │   ├── SignInPage.jsx
    │   └── OrdersPage.jsx
    ├── utils/
    │   └── format.js
    └── styles/
        └── global.css         # color tokens + reset
```

## How the realtime channel works

```
[staff: PATCH /api/orders/:id/status]
            ↓ updates DB
            ↓ publishOrderEvent('order.updated', order)
              ├── EventBus → "staff" channel    → every dashboard's SSE
              └── EventBus → "order:<id>" channel → that customer's screen
```

The customer mobile app uses a polling hook (every 3s) instead of SSE because
React Native doesn't ship an EventSource and we didn't want to add a native
module just for this. The dashboard runs in the browser, where EventSource
is built in.
