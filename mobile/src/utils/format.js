// Tiny formatting helpers used everywhere in the UI.
export function formatPrice(cents) {
  if (typeof cents !== 'number') return '€0.00';
  return `€${(cents / 100).toFixed(2)}`;
}

export function formatStatus(status) {
  switch (status) {
    case 'PAID': return 'Paid · waiting on barista';
    case 'PREPARING': return 'Preparing your order';
    case 'READY': return 'Ready in your locker';
    case 'PICKED_UP': return 'Picked up';
    case 'CANCELLED': return 'Cancelled';
    default: return status;
  }
}

export function formatTime(iso) {
  try {
    const d = new Date(iso);
    const today = new Date();
    const sameDay = d.toDateString() === today.toDateString();
    const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (sameDay) return `Today, ${time}`;
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
    return `${d.toLocaleDateString([], { weekday: 'short' })}, ${time}`;
  } catch {
    return '';
  }
}

export function formatEta(order) {
  if (!order) return { label: '~8 min', detail: '' };
  switch (order.status) {
    case 'PAID':      return { label: '~8 min',  detail: 'Your barista is on it!' };
    case 'PREPARING': return { label: '~3 min',  detail: 'Almost there…' };
    case 'READY':     return { label: 'Ready! 🎉', detail: `Head to ${order.locker?.location || `Locker #${order.locker?.number}`}` };
    case 'PICKED_UP': return { label: 'All done', detail: 'Enjoy your coffee ☕' };
    case 'CANCELLED': return { label: 'Cancelled', detail: '' };
    default: return { label: order.status, detail: '' };
  }
}
