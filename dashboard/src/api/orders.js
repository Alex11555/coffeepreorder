// Order endpoints used by the dashboard.
import { api, API_BASE_URL } from './client.js';

// Returns all currently-active orders (PAID / PREPARING / READY).
export const fetchActiveOrders = () => api('/api/orders/active');

export const updateOrderStatus = (orderId, status) =>
  api(`/api/orders/${orderId}/status`, { method: 'PATCH', body: { status } });

// EventSource doesn't support custom headers — send the JWT in the URL.
export function streamUrl() {
  const token = localStorage.getItem('authToken') || '';
  return `${API_BASE_URL}/api/orders/stream?token=${encodeURIComponent(token)}`;
}
