// Loyalty / rewards logic — single source of truth, shared by the server
// and mirrored in the mobile app (mobile/src/utils/loyalty.js).
//
// Model:
//  - You EARN points on the amount you actually pay (1 point per €0.10 = per 10 cents).
//  - `lifetimePoints` only grows and decides your TIER.
//  - Higher tiers earn points faster (multiplier) and get an automatic
//    percentage discount on every order.
//  - You can REDEEM your spendable `points` balance at checkout:
//    100 points = €1.00 off (1 point = 1 cent).

// Points earned per 10 cents spent (before multiplier). 1 = "1 pt per €0.10".
const BASE_POINTS_PER_10_CENTS = 1;

// 100 points == 100 cents == €1.00 off.
const CENTS_PER_POINT = 1;

// Tiers, ascending. `min` is the lifetimePoints threshold to reach it.
// `discountPct` is auto-applied to every order; `multiplier` boosts earning.
const TIERS = [
  { key: 'BRONZE',   name: 'Bronze',   emoji: '🥉', min: 0,    discountPct: 0,  multiplier: 1.0 },
  { key: 'SILVER',   name: 'Silver',   emoji: '🥈', min: 500,  discountPct: 5,  multiplier: 1.2 },
  { key: 'GOLD',     name: 'Gold',     emoji: '🥇', min: 1500, discountPct: 10, multiplier: 1.5 },
  { key: 'PLATINUM', name: 'Platinum', emoji: '💎', min: 4000, discountPct: 15, multiplier: 2.0 },
];

function tierForPoints(lifetimePoints) {
  let current = TIERS[0];
  for (const t of TIERS) {
    if (lifetimePoints >= t.min) current = t;
  }
  return current;
}

function nextTier(lifetimePoints) {
  return TIERS.find((t) => t.min > lifetimePoints) || null;
}

// How many points an amount (in cents) earns at a given tier.
function pointsForSpend(cents, tier) {
  const base = Math.floor(cents / 10) * BASE_POINTS_PER_10_CENTS;
  return Math.round(base * (tier?.multiplier ?? 1));
}

// Convert a redeem-points request into a capped discount (cents).
// Never discount more than the order subtotal, never spend more than balance.
function redeemToCents(requestedPoints, balance, maxCents) {
  const usablePoints = Math.max(0, Math.min(requestedPoints || 0, balance));
  const rawCents = usablePoints * CENTS_PER_POINT;
  const cappedCents = Math.min(rawCents, maxCents);
  // Recompute points actually consumed after capping to the order total.
  const pointsUsed = Math.ceil(cappedCents / CENTS_PER_POINT);
  return { discountCents: cappedCents, pointsUsed };
}

// Build the loyalty summary object returned to clients.
function loyaltySummary(user) {
  const lifetime = user.lifetimePoints ?? 0;
  const tier = tierForPoints(lifetime);
  const next = nextTier(lifetime);
  return {
    points: user.points ?? 0,
    lifetimePoints: lifetime,
    tier: { key: tier.key, name: tier.name, emoji: tier.emoji, discountPct: tier.discountPct, multiplier: tier.multiplier },
    nextTier: next
      ? { key: next.key, name: next.name, emoji: next.emoji, pointsToGo: next.min - lifetime }
      : null,
    // Handy for the UI: what €1 off costs and the redeemable value of the balance.
    centsPerPoint: CENTS_PER_POINT,
    balanceValueCents: (user.points ?? 0) * CENTS_PER_POINT,
  };
}

module.exports = {
  TIERS,
  CENTS_PER_POINT,
  tierForPoints,
  nextTier,
  pointsForSpend,
  redeemToCents,
  loyaltySummary,
};
