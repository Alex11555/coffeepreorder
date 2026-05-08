// Live orders page — three columns (New / Preparing / Ready) fed by SSE.
//
// When the staff hits "Mark Ready" we PATCH the status; the API broadcasts
// on the staff channel AND on `order:${id}`, so the customer's mobile app
// (which polls /api/orders/:id every few seconds) flips to "Ready" almost
// instantly. Other dashboards open in other browsers also see the update
// without refreshing.
import React, { useCallback, useMemo } from 'react';

import Topbar from '../components/Topbar.jsx';
import OrdersColumn from '../components/OrdersColumn.jsx';
import useLiveOrders from '../hooks/useLiveOrders.js';
import { updateOrderStatus } from '../api/orders.js';

export default function OrdersPage() {
  const { orders, loading, error, connected, applyLocal } = useLiveOrders();

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

  return (
    <div style={S.page}>
      <Topbar live={connected} />
      <main style={S.main}>
        <header style={S.headerRow}>
          <div>
            <h1 style={S.title}>Live Orders</h1>
            <p style={S.subtitle}>
              {loading ? 'Loading…' : `${orders.length} order${orders.length === 1 ? '' : 's'} on the bar`}
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
        </div>
      </main>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', background: 'var(--bg)' },
  main: { padding: '20px 28px 60px', maxWidth: 1400, margin: '0 auto' },
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
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 24,
  },
  error: { color: 'var(--danger)', fontSize: 13 },
};
