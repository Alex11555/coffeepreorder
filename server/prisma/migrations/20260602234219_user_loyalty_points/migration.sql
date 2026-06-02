-- Loyalty points: redeemable balance + lifetime total (drives tier).
ALTER TABLE "User" ADD COLUMN "points" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lifetimePoints" INTEGER NOT NULL DEFAULT 0;

-- Track per-order points so cancellations can reverse them cleanly.
ALTER TABLE "Order" ADD COLUMN "pointsEarned" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "pointsRedeemed" INTEGER NOT NULL DEFAULT 0;
