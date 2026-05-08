# Server

Express + Prisma + PostgreSQL backend.

## Setup

```bash
cp .env.example .env
# edit DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run seed   # loads menu + 12 sample lockers
npm run dev
```

## API surface

| Method | Path                   | Auth | Purpose                          |
|-------:|------------------------|------|----------------------------------|
|  POST  | `/api/auth/signup`     |  -   | Create account, returns JWT      |
|  POST  | `/api/auth/signin`     |  -   | Sign in, returns JWT             |
|   GET  | `/api/auth/me`         | yes  | Current user                     |
|   GET  | `/api/menu`            | yes  | List of products                 |
|   GET  | `/api/lockers`         | yes  | List of available lockers        |
|  POST  | `/api/orders`          | yes  | Create order + payment + QR      |
|   GET  | `/api/orders`          | yes  | Current user's orders            |
|   GET  | `/api/orders/:id`      | yes  | One order with items + QR token  |
|  PATCH | `/api/orders/:id/status` | yes (staff) | Update status (barista) |
|  POST  | `/api/pickup/scan`     |  -   | Locker hardware scans the QR     |

## Security notes

- Passwords are stored as bcrypt hashes (12 rounds).
- JWTs are signed with `JWT_SECRET` and expire per `JWT_EXPIRES_IN`.
- QR tokens are 32-byte random strings. Only a **sha-256 hash** is persisted in
  the `QrCode` table; the raw token is returned once to the phone and never
  stored server-side. This is the same posture as session tokens.
- `/api/pickup/scan` is unauthenticated because the locker hardware presents
  the token by virtue of having scanned it. In production you would also
  authenticate the locker hardware (mTLS, shared secret, etc.) — see
  `routes/pickup.js`.

## Notes on staff role

The "barista updates status" endpoint trusts a `role=STAFF` claim on the user.
Seed creates one staff account: `barista@coffee.app / barista1234`.
