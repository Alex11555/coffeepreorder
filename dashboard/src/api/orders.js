// Order endpoints used by the dashboard.
import { api, API_BASE_URL } from './client.js';

// All currently-active orders (PAID / PREPARING / READY).
export const fetchActiveOrders = () => api('/api/orders/active');

// Recently picked-up orders, newest first (server caps at 50).
export const fetchPickedUpOrders = () => api('/api/orders/picked-up');

export const updateOrderStatus = (orderId, status) =>
  api(`/api/orders/${orderId}/status`, { method: 'PATCH', body: { status } });

// Remove ONE picked-up (or cancelled) order from the database.
export const deleteOrder = (orderId) =>
  api(`/api/orders/${orderId}`, { method: 'DELETE' });

// Bulk-delete every picked-up order.
export const clearPickedUpOrders = () =>
  api('/api/orders/picked-up', { method: 'DELETE' });

// EventSource doesn't support custom headers — send the JWT in the URL.
export function streamUrl() {
  const token = localStorage.getItem('authToken') || '';
  return `${API_BASE_URL}/api/orders/stream?token=${encodeURIComponent(token)}`;
}
