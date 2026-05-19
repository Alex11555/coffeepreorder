// Live orders page — four columns (New / Preparing / Ready / Picked Up)
// fed by SSE. Picked-up orders show a per-card ✕ delete button and a
// "Clear all" button in the column header.
import React, { useCallback, useMemo } from 'react';

import Topbar from '../components/Topbar.jsx';
import OrdersColumn from '../components/OrdersColumn.jsx';
import useLiveOrders from '../hooks/useLiveOrders.js';
import {
  updateOrderStatus,
  deleteOrder,
  clearPickedUpOrders,
} from '../api/orders.js';

export default function OrdersPage() {
  const {
    orders,
    pickedUp,
    loading,
    error,
    connected,
    applyLocal,
    removeById,
    removeAllPickedUp,
  } = useLiveOrders();

  const grouped = useMemo(() => ({
    PAID:      orders.filter((o) => o.status === 'PAID'),
    PREPARING: orders.filter((o) => o.status === 'PREPARING'),
    READY:     orders.filter((o) => o.status === 'READY'),
  }), [orders]);

  const onStatusChange = useCallback(async (orderId, status) => {
    // Optimistic: drop/move locally so the click feels instant. The
    // SSE broadcast will overwrite this with the canonical server state.
    const found = orders.find((o) => o.id === orderId);
    if (found) applyLocal({ ...found, status });
    await updateOrderStatus(orderId, status);
  }, [orders, applyLocal]);

  const onDeleteOne = useCallback(async (orderId) => {
    // Optimistic remove — the SSE will confirm.
    removeById(orderId);
    await deleteOrder(orderId);
  }, [removeById]);

  const onClearAllPickedUp = useCallback(async () => {
    removeAllPickedUp();
    await clearPickedUpOrders();
  }, [removeAllPickedUp]);

  const totalActive = orders.length;

  return (
    <div style={S.page}>
      <Topbar live={connected} />
      <main style={S.main}>
        <header style={S.headerRow}>
          <div>
            <h1 style={S.title}>Live Orders</h1>
            <p style={S.subtitle}>
              {loading ? 'Loading…' : `${totalActive} order${totalActive === 1 ? '' : 's'} on the bar · ${pickedUp.length} picked up`}
            </p>
          </div>
          {error ? <div style={S.error}>{error}</div> : null}
        </header>

        <div style={S.cols}>
          <OrdersColumn
            title="New"
            accent="var(--accent)"
            orders={grouped.PAID}
            emptyText="No new orders. Take a breath ☕"
            onStatusChange={onStatusChange}
          />
          <OrdersColumn
            title="Preparing"
            accent="var(--accent-light)"
            orders={grouped.PREPARING}
            emptyText="Nothing in the queue."
            onStatusChange={onStatusChange}
          />
          <OrdersColumn
            title="Ready for Pickup"
            accent="var(--success)"
            orders={grouped.READY}
            emptyText="Nothing waiting in a locker."
            onStatusChange={onStatusChange}
          />
          <OrdersColumn
            title="Picked Up"
            accent="var(--cream-muted)"
            orders={pickedUp}
            emptyText="No completed orders yet."
            onStatusChange={onStatusChange}
            onDelete={onDeleteOne}
            onClearAll={onClearAllPickedUp}
          />
        </div>
      </main>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', background: 'var(--bg)' },
  main: { padding: '20px 28px 60px', maxWidth: 1600, margin: '0 auto' },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
    gap: 16,
  },
  title: { fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 700, margin: 0, color: '#fdf8f2' },
  subtitle: { color: 'var(--cream-muted)', fontSize: 13, marginTop: 4 },
  cols: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 20,
  },
  error: { color: 'var(--danger)', fontSize: 13 },
};
