// Tiny formatters shared across dashboard pages.
export function formatPrice(cents) {
  if (typeof cents !== 'number') return '€0.00';
  return `€${(cents / 100).toFixed(2)}`;
}

// Human "3m ago" / "just now".
export function timeAgo(iso) {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const sec = Math.max(0, Math.floor((now - t) / 1000));
  if (sec < 30) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleString();
}

export function shortId(id) {
  return 'BRW-' + (id || '').slice(-4).toUpperCase();
}
