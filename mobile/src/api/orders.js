// Order endpoints.
import { api } from './client';

export const createOrder = ({ lockerId, items, payment }) =>
  api('/api/orders', { method: 'POST', body: { lockerId, items, payment } });

export const fetchOrders = () => api('/api/orders');

export const fetchOrder = (id) => api(`/api/orders/${id}`);

// Customer confirms they picked up the order — flips status to PICKED_UP.
// Only works while the order is READY.
export const confirmPickup = (id) =>
  api(`/api/orders/${id}/picked-up`, { method: 'POST' });
