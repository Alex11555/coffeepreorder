// Mirror of server/src/utils/loyalty.js for client-side display & previews.
// The SERVER is always the source of truth for actual points math — these
// helpers just let the UI show tiers, progress, and estimated earnings.

export const CENTS_PER_POINT = 1;

export const TIERS = [
  { key: 'BRONZE',   name: 'Bronze',   emoji: '🥉', min: 0,    discountPct: 0,  multiplier: 1.0, color: '#b87333' },
  { key: 'SILVER',   name: 'Silver',   emoji: '🥈', min: 500,  discountPct: 5,  multiplier: 1.2, color: '#aab4c0' },
  { key: 'GOLD',     name: 'Gold',     emoji: '🥇', min: 1500, discountPct: 10, multiplier: 1.5, color: '#e8c34a' },
  { key: 'PLATINUM', name: 'Platinum', emoji: '💎', min: 4000, discountPct: 15, multiplier: 2.0, color: '#7fd4e0' },
];

export function tierForPoints(lifetimePoints = 0) {
  let current = TIERS[0];
  for (const t of TIERS) if (lifetimePoints >= t.min) current = t;
  return current;
}

export function nextTier(lifetimePoints = 0) {
  return TIERS.find((t) => t.min > lifetimePoints) || null;
}

export function pointsForSpend(cents, tier) {
  const base = Math.floor(cents / 10);
  return Math.round(base * (tier?.multiplier ?? 1));
}

// Returns 0..1 progress toward the next tier.
export function tierProgress(lifetimePoints = 0) {
  const cur = tierForPoints(lifetimePoints);
  const nxt = nextTier(lifetimePoints);
  if (!nxt) return 1;
  const span = nxt.min - cur.min;
  return Math.max(0, Math.min(1, (lifetimePoints - cur.min) / span));
}
