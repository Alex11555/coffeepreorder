// Poll a single order every 3s while the screen is mounted.
//
// The web dashboard uses real SSE; React Native doesn't ship an EventSource,
// and pulling in a native SSE module just for live status is overkill — the
// number of in-flight orders per phone is exactly one, and a 3s poll is fine.
import { useEffect, useState, useCallback } from 'react';
import { fetchOrder } from '../api/orders';

const STOP_AT = new Set(['PICKED_UP', 'CANCELLED']);

export default function useOrderLive(orderId, { initial = null, intervalMs = 3000 } = {}) {
  const [order, setOrder] = useState(initial);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!orderId) return;
    try {
      const fresh = await fetchOrder(orderId);
      setOrder(fresh);
      setError('');
      return fresh;
    } catch (e) {
      setError(e.message || 'Failed to refresh order');
    }
  }, [orderId]);

  useEffect(() => {
    // When orderId is cleared (e.g. after pickup), reset cached order
    // so callers don't render stale data.
    if (!orderId) {
      setOrder(null);
      setError('');
      return undefined;
    }
    let cancelled = false;
    let timer = null;

    async function tick() {
      const fresh = await refresh();
      if (cancelled) return;
      // Stop polling once the order is in a terminal state.
      if (fresh && STOP_AT.has(fresh.status)) return;
      timer = setTimeout(tick, intervalMs);
    }
    tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderId, intervalMs, refresh]);

  return { order, error, refresh, setOrder };
}
