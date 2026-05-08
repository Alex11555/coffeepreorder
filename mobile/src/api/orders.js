// Order endpoints.
import { api } from './client';

export const createOrder = ({ lockerId, items, payment }) =>
  api('/api/orders', { method: 'POST', body: { lockerId, items, payment } });

export const fetchOrders = () => api('/api/orders');

export const fetchOrder = (id) => api(`/api/orders/${id}`);
