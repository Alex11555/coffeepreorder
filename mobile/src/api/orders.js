// Order endpoints.
import { api } from './client';

export const createOrder = ({ lockerId, items, payment }) =>
  api('/api/orders', { method: 'POST', body: { lockerId, items, payment } });

export const fetchOrders = () => api('/api/orders');

export const fetchOrder = (id) => api(`/api/orders/${id}`);

// Open the assigned compartment door (button path). Marks the order PICKED_UP
// and tells the Pi to pulse the solenoid. Only works while the order is READY.
export const openDoor = (id) =>
  api(`/api/orders/${id}/open`, { method: 'POST' });

// Legacy: confirm pickup without opening the door (kept for safety).
export const confirmPickup = (id) =>
  api(`/api/orders/${id}/picked-up`, { method: 'POST' });
