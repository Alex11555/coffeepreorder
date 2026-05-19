// One vertical column on the kanban-style dashboard (e.g. "New", "Preparing").
// Optionally renders a "Clear all" icon button next to the header when
// `onClearAll` is provided — used for the Picked Up column.
import React, { useState } from 'react';
import OrderCard from './OrderCard.jsx';

export default function OrdersColumn({
  title,
  accent,
  orders,
  emptyText,
  onStatusChange,
  onDelete,
  onClearAll,
}) {
  const [busyClearing, setBusyClearing] = useState(false);

  async function handleClearAll() {
    if (busyClearing) return;
    if (!confirm(`Delete all ${orders.length} picked-up order${orders.length === 1 ? '' : 's'}?`)) return;
    setBusyClearing(true);
    try {
      await onClearAll();
    } finally {
      setBusyClearing(false);
    }
  }

  return (
    <section style={S.col}>
      <header style={S.header}>
        <span style={{ ...S.dot, background: accent }} />
        <h2 style={S.title}>{title}</h2>
        <span style={S.count}>{orders.length}</span>
        {onClearAll && orders.length > 0 ? (
          <button
            style={S.clearBtn}
            onClick={handleClearAll}
            disabled={busyClearing}
            title="Clear all picked-up orders"
          >
            🗑️ Clear all
          </button>
        ) : null}
      </header>
      {orders.length === 0 ? (
        <div style={S.empty}>{emptyText}</div>
      ) : (
        <div style={S.list}>
          {orders.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}

const S = {
  col: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  header: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
  dot: { width: 10, height: 10, borderRadius: 5, display: 'inline-block' },
  title: {
    fontFamily: 'var(--serif)',
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text)',
    margin: 0,
  },
  count: {
    background: 'var(--surface)',
    color: 'var(--cream-muted)',
    fontSize: 11,
    padding: '3px 10px',
    borderRadius: 999,
    fontWeight: 700,
  },
  clearBtn: {
    marginLeft: 'auto',
    background: 'transparent',
    border: '1px solid var(--border-strong)',
    color: 'var(--cream-muted)',
    fontSize: 11,
    fontWeight: 600,
    padding: '5px 10px',
    borderRadius: 8,
    cursor: 'pointer',
  },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  empty: {
    border: '1px dashed var(--border-strong)',
    borderRadius: 12,
    padding: '24px 16px',
    color: 'var(--cream-faint)',
    fontSize: 12,
    textAlign: 'center',
  },
};
