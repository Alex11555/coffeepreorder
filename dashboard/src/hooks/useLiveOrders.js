// useLiveOrders — fetch the active-orders snapshot once, then keep it in
// sync via the SSE feed at /api/orders/stream.
//
// Server emits three event shapes we care about:
//   { type: 'order.created', order }
//   { type: 'order.updated', order }
//   { type: 'order.deleted', order: { id } }
//
// We split state into:
//   - `orders`   — anything still on the bar (PAID / PREPARING / READY)
//   - `pickedUp` — recently completed orders (PICKED_UP), so the dashboard
//                  can show them in a "Picked Up" section and let the
//                  barista delete them one-by-one or all at once.
import { useEffect, useState, useCallback, useRef } from 'react';

import { fetchActiveOrders, fetchPickedUpOrders, streamUrl } from '../api/orders.js';

const ACTIVE_STATUSES = new Set(['PAID', 'PREPARING', 'READY']);

export default function useLiveOrders() {
  const [orders, setOrders] = useState([]);
  const [pickedUp, setPickedUp] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const esRef = useRef(null);

  const upsert = useCallback((order) => {
    if (ACTIVE_STATUSES.has(order.status)) {
      // Active: keep in `orders`, drop from `pickedUp` (just in case).
      setOrders((prev) => {
        const without = prev.filter((o) => o.id !== order.id);
        return [...without, order].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      });
      setPickedUp((prev) => prev.filter((o) => o.id !== order.id));
    } else if (order.status === 'PICKED_UP') {
      // Transitioned to picked-up: move from active list to pickedUp list.
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      setPickedUp((prev) => {
        const without = prev.filter((o) => o.id !== order.id);
        return [order, ...without]; // newest first
      });
    } else {
      // CANCELLED: just drop from both lists.
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      setPickedUp((prev) => prev.filter((o) => o.id !== order.id));
    }
  }, []);

  const removeById = useCallback((id) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    setPickedUp((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const removeAllPickedUp = useCallback(() => {
    setPickedUp([]);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setError('');
      const [active, picked] = await Promise.all([
        fetchActiveOrders(),
        fetchPickedUpOrders(),
      ]);
      setOrders(active);
      setPickedUp(picked);
    } catch (e) {
      setError(e.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const es = new EventSource(streamUrl());
    esRef.current = es;
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (data.type === 'order.created' || data.type === 'order.updated') {
          upsert(data.order);
        } else if (data.type === 'order.deleted' && data.order?.id) {
          removeById(data.order.id);
        }
      } catch {
        // ignore malformed frames
      }
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [refresh, upsert, removeById]);

  return {
    orders,
    pickedUp,
    loading,
    error,
    connected,
    refresh,
    applyLocal: upsert,
    removeById,
    removeAllPickedUp,
  };
}
