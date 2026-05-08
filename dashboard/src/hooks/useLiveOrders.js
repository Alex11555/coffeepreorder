// useLiveOrders — fetch the active-orders snapshot once, then keep it in
// sync via the SSE feed at /api/orders/stream.
//
// Server emits two event shapes we care about:
//   { type: 'order.created', order }
//   { type: 'order.updated', order }
//
// We just upsert by order.id, then drop terminal-status orders so the
// dashboard view is always "what's still on the bar".
import { useEffect, useState, useCallback, useRef } from 'react';

import { fetchActiveOrders, streamUrl } from '../api/orders.js';

const ACTIVE_STATUSES = new Set(['PAID', 'PREPARING', 'READY']);

export default function useLiveOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const esRef = useRef(null);

  const upsert = useCallback((order) => {
    setOrders((prev) => {
      const without = prev.filter((o) => o.id !== order.id);
      if (!ACTIVE_STATUSES.has(order.status)) return without;
      return [...without, order].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
    });
  }, []);

  const refresh = useCallback(async () => {
    try {
      setError('');
      const data = await fetchActiveOrders();
      setOrders(data);
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
        }
      } catch {
        // ignore malformed frames
      }
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [refresh, upsert]);

  return { orders, loading, error, connected, refresh, applyLocal: upsert };
}
